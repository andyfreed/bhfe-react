import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

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
    // Create a new supabase server client
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();
      
      if (userError) {
        console.error('Error finding user by email:', userError);
      } else if (userData) {
        userId = userData.id;
        console.log(`Found user ${userId} by email ${userEmail}`);
      }
    }
    
    if (!userId) {
      return NextResponse.json({ 
        isEnrolled: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    console.log(`Checking if user ${userId} is enrolled in course ${courseId}`);
    
    // Check enrollment in the database
    const { data, error } = await supabase
      .from('user_enrollments')
      .select('id, progress, completed')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (error) {
      console.error('Error checking enrollment:', error);
      // 404 means no enrollment found, which is not an error for this endpoint
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
    
    // User is enrolled
    return NextResponse.json({
      isEnrolled: true,
      enrollment: data
    });
    
  } catch (error: any) {
    console.error('Error in enrollment check:', error);
    return NextResponse.json({ 
      isEnrolled: false, 
      error: error.message 
    }, { status: 500 });
  }
} 