import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

const supabase = createServerSupabase();

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = await verifyJWT(token);
  if (!payload || !payload.id) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, avatar_url, background_url')
    .eq('id', payload.id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}
