// apps/web/src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

/**
 * Browser client for Supabase
 * Used in client-side components and API routes
 */
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Create a new client instance (useful for server actions)
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
