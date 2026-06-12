import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for Client Components.
 * Uses the Anon key (public, read-only via RLS policies).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
