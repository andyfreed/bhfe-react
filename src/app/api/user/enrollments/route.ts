import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClientWithCookies } from '@/lib/supabaseServer';

// Get all courses that the current user is enrolled in
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClientWithCookies();
    
    // Get the current authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = authData.user.id;
    
    // Get all enrollments for the user with course details
    const { data, error } = await supabase
      .from('user_enrollments')
      .select(`
        *,
        course:course_id(
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
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/user/enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
} 