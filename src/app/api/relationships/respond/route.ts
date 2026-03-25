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
    const { relationship_id, action } = body;

    if (!relationship_id || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Valid relationship_id and action (accept/reject) required' }, { status: 400 });
    }

    // Find the relationship
    const { data: relationship, error: fetchErr } = await supabase
      .from('relationships')
      .select('*')
      .eq('id', relationship_id)
      .single();

    if (fetchErr || !relationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    // Ensure the current user is the partner (the one invited)
    if (relationship.partner_id !== payload.id) {
      return NextResponse.json({ error: 'Not authorized to respond to this invite' }, { status: 403 });
    }

    // Update the status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    const { data, error } = await supabase
      .from('relationships')
      .update({ status: newStatus })
      .eq('id', relationship_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ relationship: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
