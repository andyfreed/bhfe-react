import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token || token.value !== 'temporary-token') {
      console.error('Authentication failed: Token missing or invalid');
      throw new Error('Unauthorized');
    }
    console.log('Authentication successful');
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Unauthorized');
  }
}

// GET: Retrieve all users
export async function GET() {
  try {
    // Verify the user is authenticated and an admin
    await verifyAuth();
    
    // Create a server-side Supabase client (with service role key)
    const supabase = createServerSupabaseClient();
    
    // Fetch all users
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name');
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    // Return the user data
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error in GET /api/users:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 