import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Server-side Supabase client with service role for admin operations
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Regular client for user operations
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      // We'll primarily use our Prisma schema, but this ensures type safety
      // if we need to interact with Supabase auth directly
    }
  }
}

