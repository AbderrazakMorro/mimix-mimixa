import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Verify session exists and is completed
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify player is in this session
    const { data: playerCheck } = await supabase
      .from('session_players')
      .select('*')
      .eq('session_id', sessionId)
      .eq('player_id', user.id)
      .single();

    if (!playerCheck) {
      return NextResponse.json({ error: 'Player not in this session' }, { status: 403 });
    }

    // Delete old answers for this session
    await supabase
      .from('answers')
      .delete()
      .eq('session_id', sessionId);

    // Delete old played_questions
    await supabase
      .from('played_questions')
      .delete()
      .eq('session_id', sessionId);

    // Increment the round number to get different questions
    const currentRound = session.round ?? 1;

    // Reset session: back to in_progress, question index 0, new round
    const { error: updateError } = await supabase
      .from('game_sessions')
      .update({
        status: 'in_progress',
        current_question_index: 0,
        round: currentRound + 1,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Replay update error:', updateError);
      return NextResponse.json({ error: 'Failed to reset session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      roomCode: session.room_code,
      round: currentRound + 1,
    });
  } catch (err) {
    console.error('Replay error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
