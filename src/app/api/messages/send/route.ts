import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

const supabase = createServerSupabase();

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const payload = await verifyJWT(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { receiver_id, content } = await req.json();
    
    // content can be a JSON string if encrypted
    if (!receiver_id || !content) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Server-side securely bypasses RLS utilizing Service Role Key 
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: payload.id,
        receiver_id,
        content
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
