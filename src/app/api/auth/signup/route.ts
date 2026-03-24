import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { hashPassword } from '@/lib/hash';
import { signJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

const supabase = createServerSupabase();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const password_hash = await hashPassword(password);
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ email, password_hash })
      .select('id, email')
      .single();

    if (error || !newUser) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: error?.message || 'Error creating user', details: error }, { status: 500 });
    }

    const token = await signJWT({ id: newUser.id, email: newUser.email });
    
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({ user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
