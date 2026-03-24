import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

const supabase = createServerSupabase();

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { username, avatar_url, background_url } = body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ username, avatar_url, background_url })
      .eq('id', payload.id)
      .select('id, email, username, avatar_url, background_url')
      .single();

    if (error || !updatedUser) {
      return NextResponse.json({ error: error?.message || 'Error updating profile' }, { status: 500 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', payload.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    cookieStore.set('auth-token', '', { maxAge: 0, path: '/' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
