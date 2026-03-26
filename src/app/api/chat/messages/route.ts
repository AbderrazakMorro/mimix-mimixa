import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversation_id = searchParams.get('conversation_id');
    if (!conversation_id) return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });

    const supabase = createServerSupabase();

    // 1. Verify participation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .single();

    if (!participant) return NextResponse.json({ error: 'You are not a participant in this conversation' }, { status: 403 });

    // 2. Fetch messages with reactions
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        reactions:message_reactions (
          id,
          reaction,
          user_id
        )
      `)
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error('Fetch messages error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { conversation_id, content, message_type = 'text', metadata = {} } = await req.json();
    if (!conversation_id || !content) return NextResponse.json({ error: 'Missing content or conversation ID' }, { status: 400 });

    const supabase = createServerSupabase();

    // 1. Verify participation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .single();

    if (!participant) return NextResponse.json({ error: 'You are not a participant in this conversation' }, { status: 403 });

    // 2. Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id: user.id,
        content,
        message_type,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Update participant's last_read_at
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id);

    return NextResponse.json({ message });
  } catch (err: any) {
    console.error('Send message error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
