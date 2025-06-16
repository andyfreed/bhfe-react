import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

/**
 * GET /api/user/my-enrollments
 * Returns all courses a user is enrolled in using the same approach as the admin panel
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient() as any;
    
    // Get email parameter from query string
    const email = request.nextUrl.searchParams.get('email');
    
    // If no email provided, try to get it from the session
    if (!email) {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No email provided and no authenticated session');
        return NextResponse.json({ 
          enrollments: [], 
          error: 'Either provide an email parameter or authenticate first' 
        });
      }
      
      // Use the session email
      const userEmail = session.user.email;
      console.log(`Retrieving enrollments for authenticated user: ${userEmail}`);
      
      return await getEnrollmentsByEmail(supabase, userEmail);
    }
    
    // If email is provided, use that directly
    console.log(`Retrieving enrollments for email: ${email}`);
    return await getEnrollmentsByEmail(supabase, email);
    
  } catch (error: any) {
    console.error('Error retrieving enrollments:', error);
    return NextResponse.json({ 
      enrollments: [], 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * Helper function to get enrollments by email
 */
async function getEnrollmentsByEmail(supabase: any, email: string) {
  try {
    console.log(`Fetching enrollments for email: ${email}`);
    
    // First find the user by email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);
      
    if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ 
        enrollments: [], 
        error: `Error finding user: ${userError.message}` 
      }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      console.log(`No user found with email: ${email}`);
      return NextResponse.json({ 
        enrollments: [], 
        message: `No user found with email: ${email}` 
      });
    }
    
    const userId = users[0].id;
    console.log(`Found user ID: ${userId} for email: ${email}`);
    
    // Get enrollments for this user ID
    const { data: enrollments, error: enrollmentError } = await supabase
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
          image_url,
          table_of_contents_url,
          course_content_url
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });
      
    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      return NextResponse.json({ 
        enrollments: [], 
        error: `Error fetching enrollments: ${enrollmentError.message}` 
      }, { status: 500 });
    }
    
    console.log(`Found ${enrollments?.length || 0} enrollments for user: ${email}`);
    
    // For debugging, also show the raw enrollment IDs
    if (enrollments && enrollments.length > 0) {
      const enrollmentIds = enrollments.map((e: any) => e.id).join(', ');
      console.log(`Enrollment IDs: ${enrollmentIds}`);
    }
    
    return NextResponse.json({ 
      enrollments: enrollments || [],
      userId: userId,
      email: email
    });
  } catch (error: any) {
    console.error('Error in getEnrollmentsByEmail:', error);
    return NextResponse.json({ 
      enrollments: [], 
      error: `Internal error: ${error.message}` 
    }, { status: 500 });
  }
} 