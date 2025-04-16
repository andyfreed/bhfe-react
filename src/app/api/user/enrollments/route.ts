import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { createEnrollment } from '@/lib/supabase/enrollmentUtils';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isDevelopment } from '@/lib/devUtils';
import { SupabaseClient } from '@supabase/supabase-js';

// Define types for our enrollments data
type CourseData = {
  id: string;
  title: string;
  description: string;
  main_subject: string;
  author: string;
  table_of_contents_url: string | null;
  course_content_url: string | null;
  image_url?: string | null;
}

type EnrollmentData = {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  course: CourseData | null;
}

/**
 * GET /api/user/enrollments
 * Returns all courses a user is enrolled in
 */
export async function GET(request: NextRequest) {
  console.log(`GET /api/user/enrollments`);
  
  try {
    // Check if user is authenticated
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;
    
    console.log('API: Attempting to verify authentication');
    const supabase = createServerSupabaseClient() as any;
    
    // Check session (standard auth mechanism)
    const { data: { session } } = await supabase.auth.getSession();
    const hasSession = !!session;
    
    // Log session check result for debugging
    console.log('Session check result:', { 
      hasSession, 
      userEmail: session?.user?.email,
      adminToken: adminToken ? 'present' : 'not present'
    });
    
    let userId: string | undefined;
    
    // Admin token check - works in both dev and production for testing
    if (adminToken === 'temporary-token') {
      console.log('Admin token found - using admin user');
      // Use a fixed admin user ID that exists in the database
      userId = '1cbb829d-e51c-493d-aa4f-c197bc759615';
      console.log(`Using admin user ID: ${userId}`);
    } 
    // Normal authenticated session check
    else if (hasSession) {
      // Use the authenticated user's ID
      userId = session.user.id;
      console.log(`Using authenticated user ID: ${userId}`);
    } 
    // Not authenticated
    else {
      console.log('Not authenticated and no valid admin token');
      return NextResponse.json({ enrollments: [] }); // Return empty array instead of 401
    }
    
    if (!userId) {
      console.log('No user ID found after auth checks');
      return NextResponse.json({ enrollments: [] }); // Return empty array instead of 401
    }
    
    // Get all enrollments for the user with course details
    try {
      console.log(`Fetching enrollments for user ID: ${userId}`);
      
      // Direct single query with proper nested selection
      const enrollmentsResult = await supabase
        .from('user_enrollments')
        .select(`
          id,
          user_id,
          course_id,
          progress,
          completed,
          enrolled_at,
          enrollment_type,
          course:courses (
            id,
            title,
            description,
            main_subject,
            author,
            table_of_contents_url,
            course_content_url
          )
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });
      
      if (enrollmentsResult.error) {
        console.error('Error fetching enrollments:', enrollmentsResult.error);
        return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
      }
      
      console.log(`Enrollments found: ${enrollmentsResult.data?.length || 0}`);
      
      // Log each enrollment for debugging
      if (enrollmentsResult.data) {
        enrollmentsResult.data.forEach((enrollment: any, index: number) => {
          console.log(`Enrollment ${index + 1}: Course ID = ${enrollment.course_id}, Progress = ${enrollment.progress}%`);
        });
      }
      
      return NextResponse.json({ enrollments: enrollmentsResult.data || [] });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in enrollment API:', error);
    // Convert the error to a string for more detail
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
      console.error('Error stack:', error.stack);
    } else {
      errorMessage = String(error);
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * POST /api/user/enrollments
 * Enrolls a user in a course
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = createServerSupabaseClient() as any;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the course ID from the request body
    const { courseId } = await request.json();
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    // Check if the user is already enrolled
    const userId = session.user.id;
    
    const existingEnrollment = await supabase
      .from('user_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
      
    if (existingEnrollment.data) {
      return NextResponse.json({ 
        message: 'Already enrolled in this course',
        enrollmentId: existingEnrollment.data.id
      });
    }
    
    // Create the enrollment
    const result = await createEnrollment(userId, courseId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully enrolled in course',
      enrollmentId: result.enrollmentId
    }, { status: 201 });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json({ error: 'Failed to enroll in course' }, { status: 500 });
  }
} 