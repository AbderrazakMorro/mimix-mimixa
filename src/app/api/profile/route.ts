import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

const supabase = createServerSupabase();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const id = searchParams.get('id');
    
    if (!username && !id) {
      return NextResponse.json({ error: 'Username or ID is required' }, { status: 400 });
    }

    // Start from users table which is the source of truth for identity
    let query = supabase
      .from('users')
      .select(`
        id, 
        username, 
        avatar_url, 
        profiles(display_name, bio, avatar_url),
        user_stats (
          games_played,
          total_score,
          best_match_percentage
        )
      `);

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('username', username);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Flatten for consistent frontend consumption
    const profileData = data.profiles?.[0] || {};
    const statsData = data.user_stats?.[0] || { games_played: 0, total_score: 0, best_match_percentage: 0 };

    const user = {
      id: data.id,
      username: data.username,
      display_name: profileData.display_name || data.username,
      avatar_url: profileData.avatar_url || data.avatar_url,
      bio: profileData.bio || null,
      user_stats: [statsData] // Keep as array for frontend compatibility if needed, or flatten further
    };

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
