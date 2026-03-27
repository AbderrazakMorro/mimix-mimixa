import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

const supabase = createServerSupabase();

export async function GET() {
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

    // Fetch relationships where the user is either the inviter or the invited partner
    const { data, error } = await supabase
      .from('relationships')
      .select(`
        id, status, created_at,
        user:users!relationships_user_id_fkey(id, username, public_key, profiles(avatar_url, display_name, bio)),
        partner:users!relationships_partner_id_fkey(id, username, public_key, profiles(avatar_url, display_name, bio))
      `)
      .or(`user_id.eq.${payload.id},partner_id.eq.${payload.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process to determine the "other" person easily for frontend
    const mapped = data?.map((rel: any) => {
      const isInviter = rel.user.id === payload.id;
      const other = isInviter ? rel.partner : rel.user;
      const p = other.profiles?.[0] || {};
      
      // Flatten profile info into otherPerson (explicit fields, no spread of raw join)
      const otherPerson = {
        id: other.id,
        username: other.username,
        public_key: other.public_key,
        avatar_url: p.avatar_url || null,
        display_name: p.display_name || other.username || 'Partner',
        bio: p.bio || null
      };
      
      return {
        id: rel.id,
        status: rel.status,
        created_at: rel.created_at,
        isInviter,
        otherPerson
      };
    });

    return NextResponse.json({ relationships: mapped || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
