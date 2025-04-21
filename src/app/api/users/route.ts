import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient, PostgrestResponse } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';

// Define types for the data we're working with
interface UserProfile {
  full_name?: string;
  company?: string;
  phone?: string;
}

interface UserRecord {
  id: string;
  email: string;
  role?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string;
    company?: string;
    phone?: string;
  };
}

interface EnrollmentRecord {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
}

interface FormattedUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
  company: string;
  phone: string;
  created_at: string;
  updated_at: string;
  enrollmentCount: number;
}

// Verify authentication
async function verifyAuth(supabase: SupabaseClient) {
  console.log('Starting auth verification...');
  
  // Check for development bypass
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode - allowing admin access for development');
    return true;
  }
  
  try {
    // Try to get user from Supabase auth cookie
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('Session error:', sessionError.message);
      return false;
    }
    
    if (!session || !session.user) {
      console.log('No session or user found');
      return false;
    }
    
    const userId = session.user.id;
    console.log('User found with ID:', userId);
    
    // Since there's no role column in the database, we'll check against a list of admin emails
    // This is a workaround since your database doesn't have a role column
    const adminEmails = [
      'admin@example.com',
      // Add any other admin emails here
    ];
    
    const isAdmin = adminEmails.includes(session.user.email || '');
    console.log('Is user admin based on email check?', isAdmin);
    
    return isAdmin;
  } catch (error: any) {
    console.error('Auth verification error:', error.message);
    return false;
  }
}

// GET: Retrieve all users
export async function GET(request: NextRequest) {
  const headersList = headers();
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials:', { 
        urlExists: !!supabaseUrl, 
        keyExists: !!supabaseKey 
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    console.log('Creating Supabase client with URL:', supabaseUrl.substring(0, 10) + '...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify admin access
    console.log('Verifying admin access...');
    const isAdmin = await verifyAuth(supabase).catch(error => {
      console.error('Auth verification error:', error);
      return false;
    });
    
    console.log('Admin access result:', isAdmin);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch users with profiles
    console.log('Fetching users...');
    const usersResponse = await supabase
      .from('users')
      .select('id, email, created_at, updated_at');
    
    if (usersResponse.error) {
      console.error('Error fetching users:', usersResponse.error);
      return NextResponse.json(
        { error: `Failed to fetch users: ${usersResponse.error.message}` },
        { status: 500 }
      );
    }
    
    const users = usersResponse.data;
    console.log(`Retrieved ${users?.length || 0} users`);
    
    // Fetch enrollments for enrollment counts
    console.log('Fetching enrollments...');
    const enrollmentsResponse = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, created_at');
    
    if (enrollmentsResponse.error) {
      console.error('Error fetching enrollments:', enrollmentsResponse.error);
      return NextResponse.json(
        { error: `Failed to fetch enrollments: ${enrollmentsResponse.error.message}` },
        { status: 500 }
      );
    }
    
    const enrollments = enrollmentsResponse.data;
    console.log(`Retrieved ${enrollments?.length || 0} enrollments`);
    
    // Count enrollments per user
    const enrollmentCounts: Record<string, number> = {};
    
    if (enrollments) {
      // Process enrollments and count per user
      enrollments.forEach(enrollment => {
        if (enrollment && enrollment.user_id) {
          enrollmentCounts[enrollment.user_id] = (enrollmentCounts[enrollment.user_id] || 0) + 1;
        }
      });
    }
    
    // Format user data
    console.log('Formatting user data...');
    const formattedUsers: FormattedUser[] = [];
    
    if (users && Array.isArray(users)) {
      users.forEach(user => {
        if (user && typeof user === 'object' && 'id' in user) {
          formattedUsers.push({
            id: user.id,
            email: user.email,
            role: 'user', // Default role since role column doesn't exist
            full_name: '', // No profile data available
            company: '',   // No profile data available
            phone: '',     // No profile data available
            created_at: user.created_at,
            updated_at: user.updated_at,
            enrollmentCount: enrollmentCounts[user.id] || 0
          });
        }
      });
    }
    
    console.log('Returning formatted data for', formattedUsers.length, 'users');
    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error: any) {
    console.error('Server error:', error);
    // Return detailed error information to help debugging
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
  const headersList = headers();
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify admin access
    const isAdmin = await verifyAuth(supabase).catch(error => {
      console.error('Auth verification error:', error);
      return false;
    });
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { email, password, full_name, company, phone, role } = await request.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Create new user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email
    });
    
    if (createError) {
      return NextResponse.json(
        { error: `Failed to create user: ${createError.message}` },
        { status: 500 }
      );
    }
    
    if (!userData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id, // Use the user ID as profile ID
        full_name,
        company,
        phone,
        role: role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // We've already created the user, so return partial success
      return NextResponse.json(
        {
          user: userData.user,
          warning: 'User created, but profile data could not be saved'
        },
        { status: 201 }
      );
    }
    
    // Return the new user with profile data
    return NextResponse.json(
      {
        id: userData.user.id,
        email: userData.user.email,
        role: role || 'user',
        full_name,
        company,
        phone,
        created_at: userData.user.created_at
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Server error in POST /api/users:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
} 