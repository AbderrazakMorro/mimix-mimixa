import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { sessionId, questionIndex, selectedOption } = await request.json();

    if (!sessionId || questionIndex === undefined || !selectedOption) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Verify session exists and is in progress
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session not found error:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 });
    }

    // Verify player is in this session
    const { data: playerCheck } = await supabase
      .from('session_players')
      .select('*')
      .eq('session_id', sessionId)
      .eq('player_id', user.id)
      .single();

    if (!playerCheck) {
      console.error('Player not in session:', { sessionId, userId: user.id });
      return NextResponse.json({ error: 'Player not in this session' }, { status: 403 });
    }

    // Insert answer (unique constraint will prevent duplicates)
    const { error: answerError } = await supabase
      .from('answers')
      .insert({
        session_id: sessionId,
        player_id: user.id,
        question_id: questionIndex,
        selected_option: selectedOption,
      });

    if (answerError) {
      if (answerError.code === '23505') {
        return NextResponse.json({ error: 'Already answered this question' }, { status: 409 });
      }
      console.error('Answer insert error details:', JSON.stringify(answerError, null, 2));
      return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
    }

    // Check if both players have answered this question
    const { data: answers } = await supabase
      .from('answers')
      .select('player_id, selected_option')
      .eq('session_id', sessionId)
      .eq('question_id', questionIndex);

    const bothAnswered = (answers?.length ?? 0) >= 2;

    if (bothAnswered) {
      // Record this question as played
      await supabase
        .from('played_questions')
        .insert({ session_id: sessionId, question_index: questionIndex })
        .select();

      const isLastQuestion = questionIndex >= (session.question_count - 1);

      if (isLastQuestion) {
        // Game complete
        await supabase
          .from('game_sessions')
          .update({ status: 'completed' })
          .eq('id', sessionId);
      } else {
        // Advance to next question
        await supabase
          .from('game_sessions')
          .update({ current_question_index: questionIndex + 1 })
          .eq('id', sessionId);
      }

      // Get partner's answer
      const partnerAnswer = answers?.find(a => a.player_id !== user.id);
      const isMatch = partnerAnswer?.selected_option === selectedOption;

      return NextResponse.json({
        bothAnswered: true,
        partnerAnswer: partnerAnswer?.selected_option,
        isMatch,
        isGameOver: isLastQuestion,
      });
    }

    return NextResponse.json({ bothAnswered: false });
  } catch (err) {
    console.error('Answer error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
