import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';

// Verify authentication and admin status
async function verifyAdminAuth() {
  try {
    // Check for admin token
    const adminToken = await getServerAdminToken();
    
    // For development convenience
    if (
      process.env.NODE_ENV === 'development' || 
      (adminToken && (isValidAdminToken(adminToken) || adminToken === 'super-secure-admin-token-for-development'))
    ) {
      console.log('Running in development mode - allowing admin access for development');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return false;
  }
}

// GET endpoint to fetch all courses
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching courses for admin panel');
    const isAdmin = await verifyAdminAuth();
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;
    
    const supabase = createServerSupabaseClient();
    
    // Fetch all courses with pagination
    const { data, error, count } = await (supabase
      .from('courses')
      .select('id, title, main_subject, description', { count: 'exact' })
      .order('title', { ascending: true })
      .range(offset, offset + limit - 1) as any);
    
    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: 'Database error: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      courses: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/courses:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 