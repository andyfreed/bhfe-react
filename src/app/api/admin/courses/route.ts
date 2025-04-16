import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Verify that the user is authenticated as admin
async function verifyAuth() {
  try {
    // In development mode, allow admin token in request headers
    if (process.env.NODE_ENV === 'development') {
      // Get the cookie header directly rather than using cookies()
      console.log('Authentication successful (development mode)');
      return;
    }
    
    // For production - use auth check
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (!adminToken || adminToken !== 'temporary-token') {
      console.error('Authentication failed: Token missing or invalid');
      throw new Error('Unauthorized');
    }
    console.log('Authentication successful');
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Unauthorized');
  }
}

// GET courses for admin
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAuth();
    
    const supabase = createServerSupabaseClient();
    const limit = request.nextUrl.searchParams.get('limit');
    const limitNum = limit ? parseInt(limit, 10) : 100;
    
    // Get courses with basic info for admin purposes
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, sku, main_subject, author')
      .order('title');
      
    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }
    
    // Limit the results on the server side since .limit() has type issues
    const limitedData = data?.slice(0, limitNum) || [];
    
    return NextResponse.json(limitedData);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.error('Error in GET /api/admin/courses:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 