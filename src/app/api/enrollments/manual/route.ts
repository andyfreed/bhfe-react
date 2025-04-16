import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/auth';

// This API is for manually creating enrollments (admin only)
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient();
    
    // Check if the user is an admin
    const isAdmin = await isUserAdmin();
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { userEmail, courseId } = body;
    
    if (!userEmail || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user by email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (userError || !users) {
      console.error('User error:', userError);
      return NextResponse.json(
        { error: `User not found with email: ${userEmail}` },
        { status: 404 }
      );
    }
    
    const userId = users.id;
    
    // Check if user is already enrolled
    const { data: existingEnrollments, error: checkError } = await supabase
      .from('user_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId);
    
    if (existingEnrollments && existingEnrollments.length > 0) {
      return NextResponse.json(
        { message: 'User is already enrolled in this course' },
        { status: 200 }
      );
    }
    
    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_enrollments')
      .insert([
        {
          user_id: userId,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          progress: 0,
          completed: false,
          format: 'manual'
        }
      ]);
    
    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError);
      return NextResponse.json(
        { error: `Failed to create enrollment: ${enrollmentError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: `User ${userEmail} enrolled in course ${courseId}` },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Error creating manual enrollment:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 