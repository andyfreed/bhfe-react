import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Creates a Supabase client with admin privileges using the service role key
 * This should only be used in server-side code and never exposed to the client
 */
export function createAdminClient() {
  // Check if we have valid credentials
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase admin credentials');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
} 