import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// This API is for manually creating enrollments (admin only)
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient() as any;
    
    // Check if the user is an admin or has admin token in development
    let isAdmin = false;
    
    // In development, accept the admin token
    if (process.env.NODE_ENV === 'development') {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader && cookieHeader.includes('admin_token=temporary-token')) {
        isAdmin = true;
        console.log('Using admin token in development mode');
      }
    } 
    
    // For production, check if the user has admin rights
    if (!isAdmin) {
      const authResponse = await supabase.auth.getUser();
      const user = authResponse.data.user;
      if (user?.app_metadata?.role === 'admin') {
        isAdmin = true;
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { userEmail, courseId, createUserIfNotExists } = body;
    
    if (!userEmail || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user by email
    const userResult = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail);
    
    const users = userResult.data || [];
    const userError = userResult.error;
    let userId = users.length > 0 ? users[0].id : null;
    
    if (userError || !userId) {
      console.error('User error:', userError);
      
      // Create user if requested and doesn't exist
      if (createUserIfNotExists || (process.env.NODE_ENV === 'development' && userEmail === 'a.freed@outlook.com')) {
        console.log('Creating new user with email:', userEmail);
        // Create the user if it doesn't exist
        const insertResult = await supabase
          .from('users')
          .insert({
            email: userEmail,
            name: userEmail.split('@')[0] // Use part of email as name
          })
          .select();
          
        const newUsers = insertResult.data || [];
        const createError = insertResult.error;
        
        if (createError || newUsers.length === 0) {
          console.error('Error creating user:', createError);
          return NextResponse.json(
            { error: `Could not create user: ${createError?.message || 'Unknown error'}` },
            { status: 500 }
          );
        }
        
        console.log('Created user for:', userEmail, 'with ID:', newUsers[0].id);
        userId = newUsers[0].id;
      } else {
        return NextResponse.json(
          { error: `User not found with email: ${userEmail}` },
          { status: 404 }
        );
      }
    }
    
    // Check if user is already enrolled
    const enrollmentCheckResult = await supabase
      .from('user_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId);
    
    const existingEnrollments = enrollmentCheckResult.data || [];
    
    if (existingEnrollments.length > 0) {
      return NextResponse.json(
        { message: 'User is already enrolled in this course' },
        { status: 200 }
      );
    }
    
    // Create enrollment
    const enrollmentResult = await supabase
      .from('user_enrollments')
      .insert([
        {
          user_id: userId,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          progress: 0,
          completed: false,
          enrollment_type: createUserIfNotExists ? 'auto' : 'manual',
          enrollment_notes: `Created via manual enrollment API${createUserIfNotExists ? ' (with auto user creation)' : ''}`
        }
      ]);
    
    const enrollmentError = enrollmentResult.error;
    
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