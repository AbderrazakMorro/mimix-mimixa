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

    const { publicKey } = await req.json();
    if (!publicKey) return NextResponse.json({ error: 'Missing public key' }, { status: 400 });

    const { error } = await supabase
      .from('users')
      .update({ public_key: publicKey })
      .eq('id', payload.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
