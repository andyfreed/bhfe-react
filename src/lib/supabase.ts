import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rakgwgjrhfsjqxpctvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJha2d3Z2pyaGZzanF4cGN0dnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNDE2NzYsImV4cCI6MjA1OTcxNzY3Nn0.2Hs2S-4XPN8R7IeUF_7hPSDfPvamPgN0QPwNSPn1nvE';

// For server-side operations
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// For client-side operations
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
}); 