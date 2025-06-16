import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/client';
import { createEnrollment, EnrollmentType, EnrollmentStatus } from '@/lib/supabase/enrollmentUtils';

/**
 * POST handler for creating a new enrollment
 * This allows admins to enroll users in courses
 */
export async function POST(req: NextRequest) {
  try {
    // Only allow in development mode for simplicity
    // In production, implement proper authentication
    if (process.env.NODE_ENV !== 'development') {
      const cookieHeader = req.headers.get('cookie') || '';
      const hasAdminCookie = cookieHeader.includes('admin_token=temporary-token');
      
      if (!hasAdminCookie) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Parse the request body
    const body = await req.json();
    const { userId, courseId, type, status, notes } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'User ID and Course ID are required' },
        { status: 400 }
      );
    }

    // Get the Supabase client
    let client;
    if (process.env.NODE_ENV === 'development') {
      const adminClient = createAdminClient();
      client = adminClient;
    } else {
      client = supabase;
    }

    if (!client) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Create the enrollment using our utility function
    const result = await createEnrollment(
      userId,
      courseId,
      {
        type: type || EnrollmentType.ADMIN,
        status: status || EnrollmentStatus.ACTIVE,
        notes,
        adminUserId: 'a3b1c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' // Default admin ID
      }
    );

    if (!result.success) {
      // If it's an existing enrollment, return a conflict status
      if (result.enrollmentId) {
        return NextResponse.json(
          { error: result.error, enrollmentId: result.enrollmentId },
          { status: 409 } // Conflict
        );
      }
      
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Fetch the created enrollment with course and user details
    const { data: enrollment, error: fetchError } = await client
      .from('user_enrollments')
      .select(`
        id,
        user_id,
        course_id,
        progress,
        completed,
        enrolled_at,
        enrollment_type,
        status,
        enrollment_notes,
        user:users(
          id,
          email,
          first_name,
          last_name
        ),
        course:courses(
          id,
          title,
          description,
          main_subject
        )
      `)
      .eq('id', result.enrollmentId)
      .single();

    if (fetchError) {
      console.error('Error fetching created enrollment:', fetchError);
      // Still return success since the enrollment was created
      return NextResponse.json({
        message: 'Enrollment created successfully, but details could not be fetched',
        enrollmentId: result.enrollmentId
      });
    }

    // Return the enrollment with full details
    return NextResponse.json({
      message: 'Enrollment created successfully',
      enrollment
    });
  } catch (error: any) {
    console.error('Error in POST /api/enrollments/create:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 