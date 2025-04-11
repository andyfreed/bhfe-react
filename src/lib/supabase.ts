import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rakgwgjrhfsjqxpctvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJha2d3Z2pyaGZzanF4cGN0dnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNDE2NzYsImV4cCI6MjA1OTcxNzY3Nn0.2Hs2S-4XPN8R7IeUF_7hPSDfPvamPgN0QPwNSPn1nvE';

// For server-side operations (basic version without cookies)
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

// File upload to Supabase Storage
export async function uploadFile(file: File, bucket: string, path: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
}

// File upload for server-side operations
export async function uploadFileFromServer(
  file: Blob,
  bucket: string,
  path: string
): Promise<string> {
  const client = createServerSupabaseClient();

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
    console.error('Error in uploadFileFromServer:', error);
    throw error;
  }
} 