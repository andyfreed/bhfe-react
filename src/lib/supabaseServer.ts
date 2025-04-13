import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// For server-side operations (without cookies)
export function createServerSupabaseClientWithCookies() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
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