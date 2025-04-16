import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// The admin user ID to set up enrollments for
const ADMIN_USER_ID = '1cbb829d-e51c-493d-aa4f-c197bc759615';

/**
 * API endpoint to ensure the admin user has enrollments for testing purposes
 * This endpoint is only available in development mode
 */
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    // Get admin client
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      throw new Error('Failed to create admin client');
    }

    // First, get all available courses
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select(`
        id,
        title,
        description
      `)
      .order('id', { ascending: true })
      .limit(5); // Get first 5 courses

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json(
        { error: 'No courses found to enroll admin in' },
        { status: 404 }
      );
    }

    // Get existing enrollments for the admin user
    const { data: existingEnrollments, error: enrollmentsError } = await supabaseAdmin
      .from('user_enrollments')
      .select(`
        id,
        course_id
      `)
      .eq('user_id', ADMIN_USER_ID);

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch existing enrollments' },
        { status: 500 }
      );
    }

    // Create a map of existing enrollments
    const enrolledCourseIds = new Set(
      existingEnrollments?.map(enrollment => enrollment.course_id) || []
    );

    // Find courses to enroll in
    const coursesToEnroll = courses.filter(course => !enrolledCourseIds.has(course.id));

    if (coursesToEnroll.length === 0) {
      return NextResponse.json({
        message: 'Admin user is already enrolled in all available courses',
        enrollments: existingEnrollments
      });
    }

    // Create enrollments for courses not already enrolled in
    const enrollmentPromises = coursesToEnroll.map(async (course) => {
      const { data, error } = await supabaseAdmin
        .from('user_enrollments')
        .insert({
          user_id: ADMIN_USER_ID,
          course_id: course.id,
          enrollment_type: 'admin',
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating enrollment for course ${course.id}:`, error);
        return { course, success: false, error };
      }

      return { course, success: true, enrollment: data };
    });

    // Wait for all enrollments to be created
    const results = await Promise.all(enrollmentPromises);

    // Count successful enrollments
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      message: `Successfully enrolled admin user in ${successCount} new courses`,
      results: results
    });
  } catch (error: any) {
    console.error('Error in setup admin enrollments:', error);
    return NextResponse.json(
      { error: 'Something went wrong', details: error.message },
      { status: 500 }
    );
  }
} 