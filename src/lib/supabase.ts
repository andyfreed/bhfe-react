import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { isDevelopment, logDevEnvironmentStatus } from './devUtils';
import { createClient as createServerClient } from './supabase/server';

// Get the Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

// Log environment status during development
if (isDevelopment) {
  logDevEnvironmentStatus();
}

// Create the Supabase client - use SSR-compatible client for browser
export const supabase = typeof window !== 'undefined' 
  ? createBrowserClient(supabaseUrl, supabaseKey)
  : createClient(supabaseUrl, supabaseKey);

// For server-side operations - use the cookie-aware server client
export async function createServerSupabaseClient() {
  return createServerClient();
}

// For service role operations (bypasses RLS)
export function createServiceRoleClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

// Upload a file to Supabase Storage
export async function uploadFile(file: File, bucket: string, path: string = '') {
  try {
    const filePath = path ? `${path}/${file.name}` : file.name;
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      upsert: true,
    });

    if (error) {
      console.error('Error uploading file:', error);
      return { data: null, error };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      data: {
        ...data,
        publicUrl: publicUrlData.publicUrl,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during file upload:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during file upload',
      },
    };
  }
}

// Upload a file from server to Supabase Storage
export async function uploadFileFromServer(
  fileBuffer: Buffer,
  fileName: string,
  bucket: string,
  path: string = ''
) {
  try {
    console.log(`Uploading file to Supabase Storage: ${bucket}/${path ? `${path}/` : ''}${fileName}`);
    
    const client = createServiceRoleClient();
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    // Perform the upload
    const { data, error } = await client.storage.from(bucket).upload(filePath, fileBuffer, {
      upsert: true,
      contentType: fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : undefined
    });

    if (error) {
      console.error('Error uploading file from server:', error);
      return { data: null, error };
    }

    if (!data || !data.path) {
      console.error('Upload succeeded but no data returned:', data);
      return { 
        data: null, 
        error: { 
          message: 'Upload succeeded but no data path returned'
        } 
      };
    }

    console.log('Successfully uploaded file, getting public URL:', data.path);
    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(data.path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('Failed to get public URL:', publicUrlData);
      return { 
        data: null, 
        error: { 
          message: 'Failed to generate public URL'
        } 
      };
    }

    // Ensure the URL is properly formatted
    const publicUrl = publicUrlData.publicUrl;
    console.log('Generated public URL:', publicUrl);

    return {
      data: {
        ...data,
        publicUrl
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during file upload from server:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during file upload from server',
        details: error instanceof Error ? error.message : String(error)
      },
    };
  }
} 