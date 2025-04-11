import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = 'https://rakgwgjrhfsjqxpctvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJha2d3Z2pyaGZzanF4cGN0dnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNDE2NzYsImV4cCI6MjA1OTcxNzY3Nn0.2Hs2S-4XPN8R7IeUF_7hPSDfPvamPgN0QPwNSPn1nvE';

// For server-side operations with cookies (only import in Server Components)
export function createServerSupabaseClientWithCookies() {
  const cookieStore = cookies();
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
  });
}

// Server-side upload function
export async function uploadFileFromServerWithAuth(
  file: Blob,
  bucket: string,
  path: string
): Promise<string> {
  const client = createServerSupabaseClientWithCookies();

  try {
    const { data, error } = await client.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) {
      console.error('Error uploading file from server:', error);
      throw error;
    }

    const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFileFromServerWithAuth:', error);
    throw error;
  }
} 