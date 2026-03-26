import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { questionCount = 10, includeAdult = false } = await request.json();

    // Generate unique 6-char room code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const supabase = createServerSupabase();

    // Create game session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        room_code: roomCode,
        host_id: user.id,
        status: 'waiting',
        question_count: questionCount,
        include_adult: includeAdult,
        current_question_index: 0,
        settings: { questionCount, includeAdult },
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Add host as first player
    const { error: playerError } = await supabase
      .from('session_players')
      .insert({
        session_id: session.id,
        player_id: user.id,
      });

    if (playerError) {
      console.error('Player insert error:', playerError);
      return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
    }

    return NextResponse.json({ roomCode, sessionId: session.id });
  } catch (err) {
    console.error('Create game error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
