import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create a direct Supabase client connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if tables exist
    const tableResults: Record<string, {
      exists: boolean;
      error: string | null;
      sample: any;
    }> = {};
    
    // Check courses table
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .limit(1);
    
    tableResults['courses'] = {
      exists: !!courses && !coursesError,
      error: coursesError ? coursesError.message : null,
      sample: courses
    };
    
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    tableResults['users'] = {
      exists: !!users && !usersError,
      error: usersError ? usersError.message : null,
      sample: users
    };
    
    // Check auth.users table
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1);
    
    tableResults['auth.users'] = {
      exists: !!authUsers && !authUsersError,
      error: authUsersError ? authUsersError.message : null,
      sample: authUsers
    };
    
    // Check user_enrollments table
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('user_enrollments')
      .select('id, user_id, course_id')
      .limit(1);
    
    tableResults['user_enrollments'] = {
      exists: !!enrollments && !enrollmentsError,
      error: enrollmentsError ? enrollmentsError.message : null,
      sample: enrollments
    };
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      tablesStatus: tableResults,
      serverTime: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Database connection test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown database connection error',
      stack: error.stack || null,
      serverTime: new Date().toISOString()
    }, { status: 500 });
  }
} 