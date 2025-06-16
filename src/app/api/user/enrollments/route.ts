import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { createEnrollment } from '@/lib/supabase/enrollmentUtils';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
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
    const supabase = await createServerSupabaseClient() as any;
    
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
    let userEmail: string | undefined;
    
    // Get email from URL for direct lookup (for debugging or direct access)
    const debugEmail = request.nextUrl.searchParams.get('debug_email');
    if (debugEmail) {
      console.log(`Debug email provided: ${debugEmail}`);
      userEmail = debugEmail;
    }
    
    // Admin token check - works in both dev and production for testing
    if (adminToken === 'temporary-token') {
      console.log('Admin token found - using admin user');
      // Try to get the user ID by email first if provided in the query
      if (userEmail) {
        console.log(`Looking up user ID for email: ${userEmail}`);
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();
          
        if (userByEmail) {
          userId = userByEmail.id;
          console.log(`Found user ID: ${userId} for email: ${userEmail}`);
        } else {
          console.log(`Could not find user ID for email: ${userEmail}, using admin user ID`);
          userId = '1cbb829d-e51c-493d-aa4f-c197bc759615';
        }
      } else {
        // Use a fixed admin user ID that exists in the database
        userId = '1cbb829d-e51c-493d-aa4f-c197bc759615';
      }
      console.log(`Using user ID: ${userId}`);
    } 
    // Normal authenticated session check
    else if (hasSession) {
      // Use the authenticated user's ID
      userId = session.user.id;
      userEmail = session.user.email;
      console.log(`Using authenticated user ID: ${userId}, email: ${userEmail}`);
    } 
    // Not authenticated but email was provided
    else if (userEmail) {
      console.log(`Not authenticated but email was provided: ${userEmail}`);
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();
        
      if (userByEmail) {
        userId = userByEmail.id;
        console.log(`Found user ID: ${userId} for email: ${userEmail}`);
      } else {
        return NextResponse.json({ 
          enrollments: [],
          message: `No user found with email: ${userEmail}` 
        });
      }
    }
    // Not authenticated
    else {
      console.log('Not authenticated and no valid admin token or email');
      return NextResponse.json({ enrollments: [] }); // Return empty array instead of 401
    }
    
    let enrollmentsResult;

    // If we have a user email, find enrollments directly by the email join
    if (userEmail) {
      console.log(`Looking up enrollments by user email: ${userEmail}`);
      
      // Find users with this email
      const { data: userByEmail, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail);
        
      if (userError) {
        console.error('Error finding user by email:', userError);
      }
      
      // If we found a user with this email, use their ID
      if (userByEmail && userByEmail.length > 0) {
        userId = userByEmail[0].id;
        console.log(`Found user ID ${userId} for email ${userEmail}`);
        
        // Query enrollments by user ID
        enrollmentsResult = await supabase
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
      } else {
        console.log(`No user found with email: ${userEmail}`);
        
        // Try looking up enrollments by joining with the users table
        // This is similar to how the admin panel finds enrollments
        enrollmentsResult = await supabase
          .from('user_enrollments')
          .select(`
            id,
            user_id,
            course_id,
            progress,
            completed,
            enrolled_at,
            enrollment_type,
            user:users!user_id(email),
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
          .eq('user.email', userEmail);
      }
    } else if (userId) {
      // If we have a user ID but no email, query directly by user ID
      console.log(`Looking up enrollments by user ID: ${userId}`);
      
      enrollmentsResult = await supabase
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
    } else {
      console.log('No user ID or email found after auth checks');
      return NextResponse.json({ enrollments: [] });
    }
    
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
    const supabase = await createServerSupabaseClient() as any;
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