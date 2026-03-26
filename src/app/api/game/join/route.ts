import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { roomCode } = await request.json();
    if (!roomCode) return NextResponse.json({ error: 'Room code required' }, { status: 400 });

    const supabase = createServerSupabase();

    // Find session by room code
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (session.status !== 'waiting') {
      return NextResponse.json({ error: 'Game already started or finished' }, { status: 400 });
    }

    // Check if user is already the host
    if (session.host_id === user.id) {
      return NextResponse.json({
        sessionId: session.id,
        roomCode: session.room_code,
        isHost: true,
        questionCount: session.question_count,
        includeAdult: session.include_adult,
      });
    }

    // Check player count
    const { count } = await supabase
      .from('session_players')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);

    if ((count ?? 0) >= 2) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    // Add player to session
    const { error: playerError } = await supabase
      .from('session_players')
      .insert({
        session_id: session.id,
        player_id: user.id,
      });

    if (playerError) {
      console.error('Player join error:', playerError);
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
    }

    // Update player2_id on the session
    await supabase
      .from('game_sessions')
      .update({ player2_id: user.id })
      .eq('id', session.id);

    return NextResponse.json({
      sessionId: session.id,
      roomCode: session.room_code,
      isHost: false,
      questionCount: session.question_count,
      includeAdult: session.include_adult,
    });
  } catch (err) {
    console.error('Join game error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
