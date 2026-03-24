import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { verifyPassword } from '@/lib/hash';
import { signJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

const supabase = createServerSupabase();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const token = await signJWT({ id: user.id, email: user.email });
    
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
