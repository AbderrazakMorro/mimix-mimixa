import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { message_id, reaction } = await req.json();
    if (!message_id || !reaction) return NextResponse.json({ error: 'Missing message ID or reaction' }, { status: 400 });

    const supabase = createServerSupabase();

    // 1. Verify message access (user must be participant in the message's conversation)
    const { data: message } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('id', message_id)
      .single();

    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', user.id)
      .single();

    if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 2. Toggle reaction
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', message_id)
      .eq('user_id', user.id)
      .eq('reaction', reaction)
      .maybeSingle();

    if (existing) {
      // Toggle OFF: Remove existing reaction
      const { error: delError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id);
      
      if (delError) throw delError;
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Toggle ON: Add new reaction
      const { error: insError } = await supabase
        .from('message_reactions')
        .insert({
          message_id,
          user_id: user.id,
          reaction
        });
      
      if (insError) throw insError;
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (err: any) {
    console.error('Toggle reaction error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
