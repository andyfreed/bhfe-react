import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseClient } from '@supabase/supabase-js';

// Only allow this in development mode
function isDevMode() {
  return process.env.NODE_ENV === 'development';
}

// Verify admin authorization
async function verifyAdminAuth(supabase: SupabaseClient) {
  // Allow all actions in development mode
  if (isDevMode()) {
    console.log('Development mode: Admin auth bypassed');
    return true;
  }

  // Get the current user
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  if (getUserError || !user) {
    console.error('Error getting user or user not found:', getUserError?.message);
    return false;
  }

  // Check if user has admin role in profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error getting profile or profile not found:', profileError?.message);
    return false;
  }

  if (profile.role !== 'admin') {
    console.error('User does not have admin role');
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  // Only allow in development mode
  if (!isDevMode()) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Verify admin authorization
    const isAdmin = await verifyAdminAuth(supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    // Generate a test email with timestamp to ensure uniqueness
    const timestamp = new Date().getTime();
    const testEmail = `test-user-${timestamp}@example.com`;
    const testPassword = 'Test123456!';
    
    console.log(`Creating test user with email: ${testEmail}`);
    
    // Step 1: Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.error('Error creating auth user:', authError.message);
      return NextResponse.json(
        { error: 'Failed to create auth user', details: authError.message },
        { status: 500 }
      );
    }
    
    const userId = authUser.user.id;
    console.log(`Created auth user with ID: ${userId}`);
    
    // Step 2: Create user in users table with role 'user'
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: testEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'user' // Set role to 'user' in users table
      });
      
    if (userError) {
      console.error('Error creating user in users table:', userError.message);
      return NextResponse.json(
        { error: 'Failed to create user record', details: userError.message },
        { status: 500 }
      );
    }
    
    // Step 3: Create profile with role 'admin' to create a mismatch
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: testEmail,
        full_name: 'Test User With Role Mismatch',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'admin' // Set role to 'admin' in profiles table - This creates the mismatch
      });
      
    if (profileError) {
      console.error('Error creating profile:', profileError.message);
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message },
        { status: 500 }
      );
    }
    
    console.log(`Successfully created test user with role mismatch: ${testEmail}`);
    console.log('- Role in users table: user');
    console.log('- Role in profiles table: admin');
    
    return NextResponse.json({
      message: 'Successfully created test user with role mismatch',
      user: {
        id: userId,
        email: testEmail,
        password: testPassword,
        usersTableRole: 'user',
        profilesTableRole: 'admin'
      }
    });
  } catch (error) {
    console.error('Error in test-role-mismatch route:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to create test user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 