import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { headers, cookies as nextCookies } from 'next/headers';
import { isUserAdmin } from '@/lib/auth';
import { PostgrestResponse } from '@supabase/supabase-js';

// Define types for our enrollments data
type CourseData = {
  id: string;
  title: string;
  description: string;
  main_subject: string;
  author: string;
  table_of_contents_url: string;
  course_content_url: string;
}

type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  course: CourseData;
}

// Get all courses that the current user is enrolled in
export async function GET(request: NextRequest) {
  try {
    // Log available cookies for debugging
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header:', cookieHeader);
    
    // Create a server-side Supabase client (with service role)
    const supabase = createServerSupabaseClient();
    
    console.log('API: Attempting to verify authentication');
    
    // Try to get the session directly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Debug logging
    console.log('Session check result:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      sessionError: sessionError?.message
    });
    
    // If the session doesn't have cookies, we need to extract them from the request
    if (sessionError || !session) {
      console.log('No session found, checking auth cookie directly');
      
      // Get auth cookies from request
      const cookies: Record<string, string> = {};
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
          const [name, value] = cookie.trim().split('=');
          if (name && value) {
            cookies[name] = value;
          }
        });
      }
      
      console.log('Available cookies:', Object.keys(cookies));
      
      // Check for admin token in cookies for bypass in development
      const hasAdminToken = cookies['admin_token'] === 'temporary-token';
      if (process.env.NODE_ENV === 'development' && hasAdminToken) {
        console.log('Admin token found in development mode - using admin user');
        // Example admin user for development testing
        const userId = 'a3b1c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'; // Replace with your admin user ID
        
        // Get enrollments for admin user
        const enrollmentResult = await supabase
          .from('user_enrollments')
          .select(`
            *,
            course:courses(
              id, 
              title, 
              description, 
              main_subject,
              author,
              table_of_contents_url,
              course_content_url
            )
          `)
          .eq('user_id', userId)
          .order('enrolled_at', { ascending: false });
          
        const { data, error } = enrollmentResult as { data: Enrollment[], error: any };
          
        if (error) {
          console.error('Error fetching admin enrollments:', error);
          throw error;
        }
        
        console.log('Admin enrollments found:', data?.length || 0);
        return NextResponse.json(data || []);
      }
      
      // Try to get user ID from auth directly
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('Direct user check:', {
        hasUser: !!user,
        userEmail: user?.email,
        userError: userError?.message
      });
      
      if (userError || !user) {
        console.error('Authentication error:', userError || 'No user found');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Use this user ID
      const userId = user.id;
      console.log('Using user ID from direct auth check:', userId);
      
      // Get all enrollments for the user with course details
      const enrollmentResult = await supabase
        .from('user_enrollments')
        .select(`
          *,
          course:courses(
            id, 
            title, 
            description, 
            main_subject,
            author,
            table_of_contents_url,
            course_content_url
          )
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });
      
      const { data, error } = enrollmentResult as { data: Enrollment[], error: any };
      
      if (error) {
        console.error('Error fetching user enrollments:', error);
        throw error;
      }

      console.log('Enrollments found:', data?.length || 0);
      
      return NextResponse.json(data || []);
    }
    
    // If we have a session, use the user ID from the session
    const userId = session.user.id;
    console.log('Using user ID from session:', userId);
    
    // Get all enrollments for the user with course details
    const enrollmentResult = await supabase
      .from('user_enrollments')
      .select(`
        *,
        course:courses(
          id, 
          title, 
          description, 
          main_subject,
          author,
          table_of_contents_url,
          course_content_url
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });
    
    const { data, error } = enrollmentResult as { data: Enrollment[], error: any };
    
    if (error) {
      console.error('Error fetching user enrollments:', error);
      throw error;
    }

    console.log('Enrollments found:', data?.length || 0);
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in GET /api/user/enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
} 