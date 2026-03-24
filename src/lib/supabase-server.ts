import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using service role key (bypasses RLS)
// This should ONLY be used in API routes, never exposed to the browser
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
