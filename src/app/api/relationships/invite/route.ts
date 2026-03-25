import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

const supabase = createServerSupabase();

export async function POST(req: Request) {
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
    const { partner_id } = body;

    if (!partner_id) {
      return NextResponse.json({ error: 'partner_id is required' }, { status: 400 });
    }

    if (partner_id === payload.id) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    // Check if partner exists
    const { data: partner, error: partnerErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', partner_id)
      .single();

    if (partnerErr || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Check if relationship already exists
    const { data: existing, error: checkErr } = await supabase
      .from('relationships')
      .select('*')
      .or(`and(user_id.eq.${payload.id},partner_id.eq.${partner_id}),and(user_id.eq.${partner_id},partner_id.eq.${payload.id})`)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Relationship already exists' }, { status: 400 });
    }

    // Insert relationship
    const { data, error } = await supabase
      .from('relationships')
      .insert({
        user_id: payload.id,
        partner_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ relationship: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
