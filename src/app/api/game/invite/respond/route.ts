import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { invite_id, action } = await request.json();
    if (!invite_id || !action) return NextResponse.json({ error: 'Invite ID and action are required' }, { status: 400 });

    const supabase = createServerSupabase();

    // 1. Fetch the invite
    const { data: invite, error: fetchError } = await supabase
      .from('game_invites')
      .select('*, game_sessions(id, room_code)')
      .eq('id', invite_id)
      .eq('receiver_id', user.id)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found or not for you' }, { status: 404 });
    }

    if (action === 'accept') {
      // 2. Add receiver to session_players
      const { error: joinError } = await supabase
        .from('session_players')
        .insert({
          session_id: invite.session_id,
          player_id: user.id
        });

      if (joinError && joinError.code !== '23505') { // Ignore unique constraint violation if already joined
        throw joinError;
      }

      // 3. Set player2_id on the game session so the room detects both players
      await supabase
        .from('game_sessions')
        .update({ player2_id: user.id })
        .eq('id', invite.session_id);

      // 4. Mark invite as accepted
      await supabase
        .from('game_invites')
        .update({ status: 'accepted' })
        .eq('id', invite_id);

      return NextResponse.json({ success: true, roomCode: invite.game_sessions.room_code, sessionId: invite.session_id });
    } else {
      // Decline/Ignore
      await supabase
        .from('game_invites')
        .delete()
        .eq('id', invite_id);

      return NextResponse.json({ success: true, message: 'Invite declined' });
    }
  } catch (err: any) {
    console.error('Game invite respond error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
