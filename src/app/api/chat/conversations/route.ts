import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const supabase = createServerSupabase();

    // 1. Fetch conversations where user is a participant
    const { data: participations, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversations (
          id,
          name,
          type,
          metadata,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (error) throw error;

    // 2. Fetch partner info and last message for each conversation
    const conversations = await Promise.all((participations || []).map(async (p: any) => {
      const conv = p.conversations;
      
      // Find other participant (for private chats)
      const { data: others } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          users:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conv.id)
        .neq('user_id', user.id);

      // Get latest message
      const { data: latestMsg } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ...conv,
        last_read_at: p.last_read_at,
        participants: others?.map((o: any) => o.users) || [],
        partner: others?.[0]?.users || null, // Convenient for private chats
        latest_message: latestMsg || null
      };
    }));

    // 3. Sort by latest message date (or creation date if no messages)
    conversations.sort((a, b) => {
      const timeA = new Date(a.latest_message?.created_at || a.created_at).getTime();
      const timeB = new Date(b.latest_message?.created_at || b.created_at).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error('Fetch conversations error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyJWT(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { type = 'private', partner_id, name } = await req.json();
    const supabase = createServerSupabase();

    if (type === 'private') {
      if (!partner_id) return NextResponse.json({ error: 'Partner ID is required for private chats' }, { status: 400 });

      // Check if private conversation already exists
      const { data: existing } = await supabase.rpc('find_private_conversation', {
        user1: user.id,
        user2: partner_id
      });

      if (existing && existing.length > 0) {
        return NextResponse.json({ conversation: existing[0] });
      }

      // Create new private conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'private' })
        .select()
        .single();
      
      if (convError) throw convError;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: partner_id }
      ]);

      return NextResponse.json({ conversation: conv });
    }

    // Support for other types (group/game) can be added here
    return NextResponse.json({ error: 'Unsupported conversation type' }, { status: 400 });
  } catch (err: any) {
    console.error('Create conversation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
