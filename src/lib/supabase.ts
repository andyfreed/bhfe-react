import { createClient } from '@supabase/supabase-js';
import { isDevelopment, isMockAuthEnabled, hasValidSupabaseCredentials, logDevEnvironmentStatus } from './devUtils';

// Get the Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

// Determine if we should use mock mode
// TEMPORARILY FORCING PRODUCTION MODE
const useMockClient = isDevelopment && (isMockAuthEnabled || !hasValidSupabaseCredentials());
// const useMockClient = false; // Force production mode

// Log environment status during development
if (isDevelopment) {
  logDevEnvironmentStatus();
  // console.log('🔧 FORCED PRODUCTION MODE: Mock client disabled');
}

// Create a mock client for development mode
function createMockClient() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        order: () => ({
          range: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://mock-storage-url.com/mock-image.jpg' } }),
      }),
    },
  };
}

// Create the Supabase client
export const supabase = useMockClient 
  ? createMockClient() 
  : createClient(supabaseUrl, supabaseKey);

// For server-side operations
export function createServerSupabaseClient() {
  if (useMockClient) {
    return createMockClient();
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

// Upload a file to Supabase Storage
export async function uploadFile(file: File, bucket: string, path: string = '') {
  try {
    if (useMockClient) {
      console.log('🔧 MOCK: File upload simulation for', { file: file.name, bucket, path });
      return {
        data: {
          path: 'mock-path',
          publicUrl: `https://mock-storage-url.com/${path || ''}${file.name}`,
        },
        error: null,
      };
    }

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
    if (useMockClient) {
      console.log('🔧 MOCK: Server file upload simulation for', { fileName, bucket, path });
      return {
        data: {
          path: 'mock-path',
          publicUrl: `https://mock-storage-url.com/${path || ''}${fileName}`,
        },
        error: null,
      };
    }

    const client = createServerSupabaseClient();
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    const { data, error } = await client.storage.from(bucket).upload(filePath, fileBuffer, {
      upsert: true,
    });

    if (error) {
      console.error('Error uploading file from server:', error);
      return { data: null, error };
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(data.path);

    return {
      data: {
        ...data,
        publicUrl: publicUrlData.publicUrl,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during file upload from server:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during file upload from server',
      },
    };
  }
} 