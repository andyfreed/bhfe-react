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
      sessionError: undefined 
    });
    
    let userId: string | undefined;
    
    // If the user doesn't have a session, check for admin token in development
    if (!hasSession) {
      // In development mode, we may use special handling for admin users
      if (isDevelopment && adminToken === 'temporary-token') {
        console.log('Admin token found in development mode - special handling');
        // Admin demo user in development - use a fixed email
        const adminEmail = 'a.freed@outlook.com';
        console.log(`Using default admin email: ${adminEmail}`);
        
        // Look up the user ID from the database using the email
        console.log(`Looking up user ID by email: ${adminEmail}`);
        try {
          const userResult = await supabase
            .from('users')
            .select('id')
            .eq('email', adminEmail)
            .single();
          
          if (userResult.error) {
            console.error('Error finding user by email:', userResult.error);
            
            // If user not found, create a test user for development
            console.log('Creating test user for development');
            const newUserId = nanoid();
            const insertResult = await supabase
              .from('users')
              .insert({
                id: newUserId,
                email: adminEmail,
                created_at: new Date().toISOString()
              });
              
            if (insertResult.error) {
              console.error('Error creating test user:', insertResult.error);
              return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
            }
            
            userId = newUserId;
            
            // Create a test enrollment
            console.log('Creating test enrollment for development');
            try {
              // First get a course to enroll in
              const coursesResult = await supabase
                .from('courses')
                .select('id')
                .limit(1)
                .single();
              
              if (coursesResult.error) {
                console.error('Error finding course:', coursesResult.error);
                return NextResponse.json({ error: 'Failed to find a course' }, { status: 500 });
              }
              
              const courseId = coursesResult.data.id;
              
              // Create the enrollment
              const enrollmentResult = await supabase
                .from('user_enrollments')
                .insert({
                  id: nanoid(),
                  user_id: userId,
                  course_id: courseId,
                  progress: 0,
                  completed: false,
                  enrolled_at: new Date().toISOString()
                });
              
              if (enrollmentResult.error) {
                console.error('Error creating test enrollment:', enrollmentResult.error);
                return NextResponse.json({ error: 'Failed to create test enrollment' }, { status: 500 });
              }
            } catch (e) {
              console.error('Error creating test enrollment:', e);
              return NextResponse.json({ error: 'Failed to create test enrollment' }, { status: 500 });
            }
          } else if (userResult.data) {
            userId = userResult.data.id;
            console.log(`Found database user ID: ${userId}`);
          } else {
            console.log('No user found with email:', adminEmail);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }
        } catch (e) {
          console.error('Error during user lookup:', e);
          return NextResponse.json({ error: 'Error during user lookup' }, { status: 500 });
        }
      } else {
        // Not authenticated and not using admin token
        console.log('Not authenticated and not using valid admin token');
        return NextResponse.json({ enrollments: [] }); // Return empty array instead of 401
      }
    } else {
      // Use the authenticated user's ID
      userId = session.user.id;
    }
    
    if (!userId) {
      console.log('No user ID found after auth checks');
      return NextResponse.json({ enrollments: [] }); // Return empty array instead of 401
    }
    
    // Get all enrollments for the user with course details
    try {
      console.log(`Fetching enrollments for user ID: ${userId}`);
      
      // Use a two-step approach that we know works
      // Step 1: Get the enrollments
      const basicEnrollmentsResult = await supabase
        .from('user_enrollments')
        .select('*')
        .eq('user_id', userId);
        
      if (basicEnrollmentsResult.error) {
        console.error('Error fetching basic enrollments:', basicEnrollmentsResult.error);
        return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
      }
      
      // Step 2: Get course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        (basicEnrollmentsResult.data || []).map(async (enrollment: any) => {
          const courseResult = await supabase
            .from('courses')
            .select('*')
            .eq('id', enrollment.course_id)
            .single();
            
          if (courseResult.error) {
            console.error(`Error fetching course ${enrollment.course_id}:`, courseResult.error);
            return {
              ...enrollment,
              course: null
            };
          }
          
          return {
            ...enrollment,
            course: courseResult.data
          };
        })
      );
      
      console.log(`Enrollments found: ${enrollmentsWithCourses.length}`);
      return NextResponse.json({ enrollments: enrollmentsWithCourses || [] });
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