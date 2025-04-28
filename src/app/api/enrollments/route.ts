import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Verify the user is authenticated as an admin
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

// POST: Create a new enrollment
export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated and an admin
    await verifyAuth();
    
    // Get enrollment data from request body
    const enrollment = await request.json();
    
    // Validate required fields
    if (!enrollment.user_id || !enrollment.course_id) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and course_id' },
        { status: 400 }
      );
    }
    
    // Create a server-side Supabase client (with service role key)
    const supabase = createServerSupabaseClient();
    
    // Prepare enrollment data with defaults
    const enrollmentData = {
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      progress: enrollment.progress || 0,
      completed: enrollment.completed || false,
      completed_at: enrollment.completed ? new Date().toISOString() : null,
      enrollment_notes: enrollment.enrollment_notes || null,
      enrolled_at: new Date().toISOString(),
      enrollment_type: enrollment.enrollment_type || 'manual',
      exam_score: enrollment.exam_score || null,
      exam_passed: enrollment.exam_passed || null,
    };
    
    // Insert the enrollment using service role
    const { data, error } = await supabase
      .from('user_enrollments')
      .insert(enrollmentData)
      .select('*, user:users(*), course:courses(*)');
    
    if (error) {
      console.error('Error creating enrollment:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This user is already enrolled in this course.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to create enrollment' },
        { status: 500 }
      );
    }
    
    // Return the new enrollment data
    return NextResponse.json(data?.[0] || null);
  } catch (error: any) {
    console.error('Unexpected error in POST /api/enrollments:', error);
    
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

// GET: Retrieve all enrollments
export async function GET() {
  try {
    // Verify the user is authenticated and an admin
    await verifyAuth();
    
    // Create a server-side Supabase client (with service role key)
    const supabase = createServerSupabaseClient();
    
    // Fetch all enrollments
    const { data, error } = await supabase
      .from('user_enrollments')
      .select('*, user:users(*), course:courses(*)');
    
    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }
    
    // Return the enrollment data
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error in GET /api/enrollments:', error);
    
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