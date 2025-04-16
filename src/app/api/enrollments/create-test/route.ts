import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// The admin user ID obtained from logs
const ADMIN_USER_ID = '1cbb829d-e51c-493d-aa4f-c197bc759615';

/**
 * GET endpoint to create a test enrollment
 * This is for debugging purposes only
 */
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    // Create admin client for direct database access
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      throw new Error('Failed to create Supabase admin client');
    }

    // First, get a course to enroll in
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (courseError) {
      console.error('Error finding course:', courseError);
      return NextResponse.json(
        { error: 'Failed to find a course to enroll in' },
        { status: 500 }
      );
    }

    console.log(`Using course: ${course.id} - ${course.title}`);

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', ADMIN_USER_ID)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);

      // If user doesn't exist, create one
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: ADMIN_USER_ID,
          email: 'a.freed@outlook.com',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      console.log(`Created user: ${newUser.id} - ${newUser.email}`);
    } else {
      console.log(`Found user: ${user.id} - ${user.email}`);
    }

    // Check if enrollment already exists
    const { data: existingEnrollment, error: existingError } = await supabaseAdmin
      .from('user_enrollments')
      .select('id')
      .eq('user_id', ADMIN_USER_ID)
      .eq('course_id', course.id)
      .maybeSingle();

    if (existingEnrollment) {
      console.log(`Enrollment already exists: ${existingEnrollment.id}`);
      return NextResponse.json({
        message: 'Enrollment already exists',
        enrollment: existingEnrollment
      });
    }

    // Create enrollment
    const enrollmentData = {
      user_id: ADMIN_USER_ID,
      course_id: course.id,
      progress: 0,
      completed: false,
      enrollment_type: 'admin',
      enrolled_at: new Date().toISOString()
    };

    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('user_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (enrollError) {
      console.error('Error creating enrollment:', enrollError);
      return NextResponse.json(
        { error: 'Failed to create enrollment', details: enrollError },
        { status: 500 }
      );
    }

    console.log(`Created enrollment: ${enrollment.id}`);
    return NextResponse.json({
      message: 'Successfully created test enrollment',
      enrollment
    });
  } catch (error: any) {
    console.error('Error in create-test endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 