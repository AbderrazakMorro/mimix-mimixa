import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServerSupabase();

    const { data: avatars, error } = await supabase
      .from('avatars')
      .select('*')
      .order('category')
      .order('name');

    if (error) {
      console.error('Error fetching avatars:', error);
      return NextResponse.json({ error: 'Failed to fetch avatars', details: error }, { status: 500 });
    }

    return NextResponse.json({ avatars });
  } catch (err) {
    console.error('Avatars error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
