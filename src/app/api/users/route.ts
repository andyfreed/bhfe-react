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

// Type for query parameters
interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  hasEnrollments?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

// Verify admin authorization
async function verifyAuth(supabase: SupabaseClient) {
  // Allow everything in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      return false;
    }

    const userId = data.session.user.id;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return false;
    }

    return profile.role === 'admin';
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
}

// Parse query parameters from request URL
function parseQueryParams(request: NextRequest): UserQueryParams {
  const url = new URL(request.url);
  
  return {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: Math.min(parseInt(url.searchParams.get('limit') || '50'), 100), // Cap at 100
    search: url.searchParams.get('search') || undefined,
    role: url.searchParams.get('role') || undefined,
    sortBy: url.searchParams.get('sortBy') || 'created_at',
    sortOrder: (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    hasEnrollments: url.searchParams.get('hasEnrollments') === 'true',
    createdAfter: url.searchParams.get('createdAfter') || undefined,
    createdBefore: url.searchParams.get('createdBefore') || undefined
  };
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
    
    // Parse query parameters
    const queryParams = parseQueryParams(request);
    console.log('Query parameters:', queryParams);
    
    // Calculate pagination values
    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(100, Math.max(10, queryParams.limit || 50));
    const offset = (page - 1) * limit;
    
    // Start building the query
    let usersQuery = supabase
      .from('users')
      .select('id, email, created_at, updated_at, role', { count: 'exact' });
    
    // Apply filters
    if (queryParams.search) {
      usersQuery = usersQuery.or(`email.ilike.%${queryParams.search}%,id.eq.${queryParams.search}`);
    }
    
    if (queryParams.role) {
      usersQuery = usersQuery.eq('role', queryParams.role);
    }
    
    if (queryParams.createdAfter) {
      usersQuery = usersQuery.gte('created_at', queryParams.createdAfter);
    }
    
    if (queryParams.createdBefore) {
      usersQuery = usersQuery.lte('created_at', queryParams.createdBefore);
    }
    
    // Apply pagination after all filters
    const countQuery = usersQuery;
    
    // Apply sorting and pagination
    usersQuery = usersQuery
      .order(queryParams.sortBy || 'created_at', { 
        ascending: queryParams.sortOrder === 'asc' 
      })
      .range(offset, offset + limit - 1);
    
    // Execute the query to get paginated users
    console.log('Fetching paginated users...');
    const usersResponse = await usersQuery;
    
    if (usersResponse.error) {
      console.error('Error fetching users:', usersResponse.error);
      return NextResponse.json(
        { error: `Failed to fetch users: ${usersResponse.error.message}` },
        { status: 500 }
      );
    }
    
    // Get the total count of users matching the filters (without pagination)
    const { count } = await countQuery;
    const totalUsers = count || 0;
    
    const users = usersResponse.data || [];
    console.log(`Retrieved ${users.length} users (page ${page} of ${Math.ceil(totalUsers / limit)})`);
    
    // Get user IDs for additional data fetching
    const userIds = users.map(user => user.id);
    
    // Fetch profiles for the users in this page
    console.log('Fetching user profiles...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, full_name, company, phone')
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }
    
    // Create a map for quick profile lookups
    const profiles: Record<string, any> = {};
    if (profilesData) {
      profilesData.forEach(profile => {
        profiles[profile.id] = profile;
      });
    }
    
    // Fetch enrollments for enrollment counts - only for the users in this page
    console.log('Fetching enrollments...');
    let enrollmentsQuery = supabase
      .from('enrollments')
      .select('user_id, course_id')
      .in('user_id', userIds);
    
    if (queryParams.hasEnrollments) {
      // We'll filter users with enrollments later, but add this to the query
      // to optimize by fetching only enrollments for users that have them
      enrollmentsQuery = enrollmentsQuery.gt('course_id', 0); 
    }
    
    const enrollmentsResponse = await enrollmentsQuery;
    
    if (enrollmentsResponse.error) {
      console.error('Error fetching enrollments:', enrollmentsResponse.error);
    }
    
    // Count enrollments per user
    const enrollmentCounts: Record<string, number> = {};
    
    if (enrollmentsResponse.data) {
      // Process enrollments and count per user
      enrollmentsResponse.data.forEach(enrollment => {
        if (enrollment.user_id) {
          enrollmentCounts[enrollment.user_id] = (enrollmentCounts[enrollment.user_id] || 0) + 1;
        }
      });
    }
    
    // Format user data
    console.log('Formatting user data...');
    let formattedUsers: FormattedUser[] = [];
    
    users.forEach(user => {
      const profile = profiles[user.id] || {};
      const enrollmentCount = enrollmentCounts[user.id] || 0;
      
      // Apply enrollment filter if specified
      if (queryParams.hasEnrollments && enrollmentCount === 0) {
        return; // Skip users with no enrollments if that filter is active
      }
      
      formattedUsers.push({
        id: user.id,
        email: user.email,
        role: profile.role || user.role || 'user', // Use role from profile or user table
        full_name: profile.full_name || '',
        company: profile.company || '',
        phone: profile.phone || '',
        created_at: user.created_at,
        updated_at: user.updated_at,
        enrollmentCount: enrollmentCount
      });
    });
    
    // If we applied the enrollments filter after fetching, we need to adjust pagination info
    const filteredTotal = queryParams.hasEnrollments 
      ? formattedUsers.length + ((page - 1) * limit) // Estimated total with filter
      : totalUsers;
    
    console.log('Returning formatted data for', formattedUsers.length, 'users');
    return NextResponse.json(formattedUsers);
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
  try {
    console.log('Creating new user...');
    
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
    const body = await request.json();
    const { email, password, full_name, company, phone, role } = body;
    
    console.log('Creating user with email:', email);
    
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
      console.error('Error creating user in auth system:', createError);
      return NextResponse.json(
        { error: `Failed to create user: ${createError.message}` },
        { status: 500 }
      );
    }
    
    if (!userData?.user?.id) {
      console.error('User created but no ID returned');
      return NextResponse.json(
        { error: 'Failed to create user - no ID returned' },
        { status: 500 }
      );
    }
    
    const userId = userData.user.id;
    console.log('User created with ID:', userId);
    
    // Also add to users table for backup
    const { error: userInsertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        role: role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (userInsertError) {
      console.warn('Failed to insert into users table:', userInsertError.message);
    }
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId, // Use the user ID as profile ID
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
          id: userId,
          email: email,
          role: role || 'user',
          full_name: full_name || '',
          company: company || '',
          phone: phone || '',
          created_at: userData.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          warning: 'User created, but profile data could not be saved'
        },
        { status: 201 }
      );
    }
    
    // Return the new user with profile data
    return NextResponse.json(
      {
        id: userId,
        email: email,
        role: role || 'user',
        full_name: full_name || '',
        company: company || '',
        phone: phone || '',
        created_at: userData.user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
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