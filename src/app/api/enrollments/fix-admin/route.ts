import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase/admin';

// This admin user ID should match the one used in development
const ADMIN_USER_ID = '1cbb829d-e51c-493d-aa4f-c197bc759615';

// This endpoint is for fixing enrollments for the admin user in development mode
export async function GET(req: NextRequest) {
  try {
    // In production, we would authenticate the user first
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    // Create admin client to access the database with full permissions
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      throw new Error('Failed to create admin client');
    }

    // Check if an enrollment already exists for the specified course
    const { data: existingEnrollment, error: queryError } = await supabaseAdmin
      .from('user_enrollments')
      .select(`
        id,
        user_id,
        course_id,
        enrolled_at,
        enrollment_type
      `)
      .eq('user_id', ADMIN_USER_ID)
      .eq('course_id', '1')  // Course ID 1 is typically the first course
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected if no enrollment exists
      console.error('Error checking existing enrollment:', queryError);
      return NextResponse.json(
        { error: 'Failed to check existing enrollment' },
        { status: 500 }
      );
    }

    // If enrollment exists, return it
    if (existingEnrollment) {
      return NextResponse.json({
        message: 'Admin user already has an enrollment',
        enrollment: existingEnrollment
      });
    }

    // Create a new enrollment for the admin user
    const { data: newEnrollment, error: insertError } = await supabaseAdmin
      .from('user_enrollments')
      .insert({
        user_id: ADMIN_USER_ID,
        course_id: '1',  // Course ID for the course
        enrollment_type: 'admin',
        enrolled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating enrollment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully created enrollment for admin user',
      enrollment: newEnrollment
    });
    
  } catch (error: any) {
    console.error('Error in fix admin enrollment:', error);
    return NextResponse.json(
      { error: 'Something went wrong', details: error.message },
      { status: 500 }
    );
  }
} 