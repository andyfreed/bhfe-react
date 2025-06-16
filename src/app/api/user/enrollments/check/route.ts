import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

/**
 * GET /api/user/enrollments/check
 * Checks if the current user is enrolled in a specified course
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const email = searchParams.get('email');
  
  console.log('Enrollment check request params:', { courseId, email });

  if (!courseId) {
    console.error('No courseId provided in enrollment check request');
    return NextResponse.json({ error: 'No courseId provided' }, { status: 400 });
  }

  try {
    // Create a new supabase server client with service role to bypass RLS
    const supabase = createServerSupabaseClient() as any;
    
    // Get the session using the client
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session check result:', session ? 'Session found' : 'No session found');
    
    let userEmail = session?.user?.email;
    let userId = session?.user?.id;
    
    // If no session but email is provided, use the provided email
    if (!session && email) {
      console.log('No session found, using provided email:', email);
      userEmail = email;
    } else if (!session && !email) {
      console.error('No session and no email provided for enrollment check');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Looking up user with email:', userEmail);
    
    // If no userId but we have an email, look up the user by email
    if (!userId && userEmail) {
      // Look up user by email if provided
      console.log(`No user ID found, looking up user by email: ${userEmail}`);
      
      // First try auth.users which is the source of truth
      const { data: authUserData, error: authUserError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
        
      if (!authUserError && authUserData) {
        userId = authUserData.id;
        console.log(`Found user ${userId} in auth.users by email ${userEmail}`);
      } else {
        // Fall back to public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
        
        if (userError) {
          console.error('Error finding user by email:', userError);
        } else if (userData) {
          userId = userData.id;
          console.log(`Found user ${userId} in public.users by email ${userEmail}`);
        }
      }
    }
    
    if (!userId) {
      return NextResponse.json({ 
        isEnrolled: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    console.log(`Checking if user ${userId} is enrolled in course ${courseId}`);
    
    // Use RPC to check enrollment, bypassing RLS
    const { data: enrollmentData, error: enrollmentError } = await supabase.rpc(
      'check_user_enrollment',
      { user_id_param: userId, course_id_param: courseId }
    );
    
    // If RPC call fails, fall back to direct query
    if (enrollmentError) {
      console.log('RPC call failed, falling back to direct query:', enrollmentError);
      
      // Check enrollment in the database
      const { data, error } = await supabase
        .from('user_enrollments')
        .select('id, progress, completed')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking enrollment:', error);
        
        if (error.code === 'PGRST116') {
          return NextResponse.json({ 
            isEnrolled: false,
            message: 'User is not enrolled in this course'
          });
        }
        
        return NextResponse.json({ 
          isEnrolled: false, 
          error: `Database error: ${error.message}` 
        }, { status: 500 });
      }
      
      if (!data) {
        return NextResponse.json({ 
          isEnrolled: false,
          message: 'User is not enrolled in this course'
        });
      }
      
      // User is enrolled
      return NextResponse.json({
        isEnrolled: true,
        enrollment: data
      });
    }
    
    // Process RPC response
    if (enrollmentData && enrollmentData.is_enrolled) {
      return NextResponse.json({
        isEnrolled: true,
        enrollment: enrollmentData.enrollment_data
      });
    } else {
      return NextResponse.json({ 
        isEnrolled: false,
        message: 'User is not enrolled in this course'
      });
    }
    
  } catch (error: any) {
    console.error('Error in enrollment check:', error);
    return NextResponse.json({ 
      isEnrolled: false, 
      error: error.message 
    }, { status: 500 });
  }
} 