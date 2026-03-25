import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

const supabase = createServerSupabase();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const payload = await verifyJWT(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Check my profile
    const { data: me, error: err1 } = await supabase
      .from('users')
      .select('id, username, public_key')
      .eq('id', payload.id)
      .single();

    // Check relationships
    const { data: rels, error: err2 } = await supabase
      .from('relationships')
      .select(`
        id, status,
        user:users!relationships_user_id_fkey(id, username, public_key),
        partner:users!relationships_partner_id_fkey(id, username, public_key)
      `)
      .or(`user_id.eq.${payload.id},partner_id.eq.${payload.id}`);

    const activeRel = rels?.find((r: any) => r.status === 'accepted');
    
    // Safely extract partner info (handling potential array return if joins are messy)
    const getFirst = (val: any) => Array.isArray(val) ? val[0] : val;
    
    let partnerInfo = null;
    if (activeRel) {
      const relUser = getFirst(activeRel.user);
      const relPartner = getFirst(activeRel.partner);
      
      if (relUser && relPartner) {
        const partnerObj = relUser.id === payload.id ? relPartner : relUser;
        partnerInfo = {
          id: partnerObj.id,
          username: partnerObj.username,
          hasKey: !!partnerObj.public_key,
          keyType: typeof partnerObj.public_key
        };
      }
    }

    return NextResponse.json({
      me: {
        id: me?.id,
        username: me?.username,
        hasKey: !!me?.public_key,
        keyType: typeof me?.public_key
      },
      partner: partnerInfo,
      relationshipCount: rels?.length || 0,
      activeFound: !!activeRel,
      env: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        roleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
