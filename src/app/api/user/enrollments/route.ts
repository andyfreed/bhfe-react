import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { headers, cookies } from 'next/headers';
import { isUserAdmin } from '@/lib/auth';

// Get all courses that the current user is enrolled in
export async function GET(request: NextRequest) {
  try {
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
    
    // If there's no session from cookies, try to get the user directly
    if (sessionError || !session) {
      // Try to get user from auth
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
      
      // In development mode, allow bypass for admin testing
      if (process.env.NODE_ENV === 'development') {
        const adminEmail = user.email;
        if (adminEmail && await isUserAdmin(adminEmail)) {
          console.log('DEVELOPMENT MODE: Admin authentication bypass enabled');
          // Add dummy for demo purposes if needed
          // Return real data if available
        }
      }
      
      // Get all enrollments for the user with course details
      const { data, error } = await supabase
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
    const { data, error } = await supabase
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