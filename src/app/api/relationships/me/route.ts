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
        user:users!relationships_user_id_fkey(id, username, public_key, profiles(avatar_url, display_name)),
        partner:users!relationships_partner_id_fkey(id, username, public_key, profiles(avatar_url, display_name))
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
      
      // Flatten profile info into otherPerson
      const otherPerson = {
        ...other,
        avatar_url: other.profiles?.[0]?.avatar_url || other.avatar_url,
        display_name: other.profiles?.[0]?.display_name || other.username
      };
      
      return {
        ...rel,
        isInviter,
        otherPerson
      };
    });

    return NextResponse.json({ relationships: mapped || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
