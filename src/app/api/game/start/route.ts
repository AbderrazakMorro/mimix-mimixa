import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { sessionId, questionCount, includeAdult } = await request.json();
    if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 });

    const supabase = createServerSupabase();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify requester is host
    if (session.host_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });
    }

    // Verify 2 players are present
    const { count } = await supabase
      .from('session_players')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if ((count ?? 0) < 2) {
      return NextResponse.json({ error: 'Need 2 players to start' }, { status: 400 });
    }

    // Start the game with settings from the host
    const updatePayload: any = {
      status: 'in_progress',
      current_question_index: 0,
    };
    if (questionCount !== undefined) updatePayload.question_count = questionCount;
    if (includeAdult !== undefined) updatePayload.include_adult = includeAdult;

    const { error: updateError } = await supabase
      .from('game_sessions')
      .update(updatePayload)
      .eq('id', sessionId);

    if (updateError) {
      console.error('Start game error:', updateError);
      return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Start game error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
