import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { partner_id, settings = {} } = await request.json();
    if (!partner_id) return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });

    const supabase = createServerSupabase();

    // 1. Verify they are partners
    const { data: relationship, error: relError } = await supabase
      .from('relationships')
      .select('id')
      .or(`and(user_id.eq.${user.id},partner_id.eq.${partner_id}),and(user_id.eq.${partner_id},partner_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single();

    if (relError || !relationship) {
      return NextResponse.json({ error: 'You must be partners to play together' }, { status: 403 });
    }

    // 2. Generate room code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // 3. Create game session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        room_code: roomCode,
        host_id: user.id,
        status: 'waiting',
        question_count: settings.questionCount || 10,
        include_adult: settings.includeAdult || false,
        settings: settings
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // 4. Add host as first player
    await supabase.from('session_players').insert({
      session_id: session.id,
      player_id: user.id,
    });

    // 5. Create the game invite
    const { data: invite, error: inviteError } = await supabase
      .from('game_invites')
      .insert({
        sender_id: user.id,
        receiver_id: partner_id,
        session_id: session.id,
        status: 'pending'
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    return NextResponse.json({ success: true, invite, roomCode, sessionId: session.id });
  } catch (err: any) {
    console.error('Game invite error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
