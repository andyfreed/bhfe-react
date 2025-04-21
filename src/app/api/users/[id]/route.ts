import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';
import { cookies } from 'next/headers';

// Verify authentication and admin status
async function verifyAdminAuth() {
  // Allow everything in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    return isValidAdminToken(token);
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return false;
  }
}

// utility to init supabase
function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Server configuration error');
  }
  return createClient(supabaseUrl, supabaseKey);
}

// GET user
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;

    console.log('Fetching user data for ID:', userId);
    
    const supabase = createAdminSupabase();
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    let authUser = userData?.user;

    // If auth lookup failed with "User not found", fall back to public.users table
    if (userError || !authUser) {
      console.log('User not found in auth system, checking public.users table');
      const { data: fallbackUser, error: fallbackError } = await supabase
        .from('users')
        .select('id, email, created_at, updated_at, role')
        .eq('id', userId)
        .single();

      if (fallbackError || !fallbackUser) {
        const msg = userError?.message || fallbackError?.message || '';
        const statusCode = (userError && userError.message?.toLowerCase().includes('not found')) || fallbackError?.code === 'PGRST116'
          ? 404
          : 500;
        console.error('User not found in any system:', msg);
        return NextResponse.json(
          { error: statusCode === 404 ? 'User not found' : `Failed to fetch user: ${msg}` },
          { status: statusCode }
        );
      }

      // Create a non-null authUser from fallbackUser
      authUser = {
        id: fallbackUser.id,
        email: fallbackUser.email,
        created_at: fallbackUser.created_at,
        last_sign_in_at: fallbackUser.updated_at,
        role: fallbackUser.role
      } as any; // Type assertion needed for partial user object
      console.log('Found user in public.users table:', fallbackUser.email);
    } else {
      console.log('Found user in auth system:', authUser.email);
    }

    // At this point authUser is guaranteed to exist
    if (!authUser) {
      console.error('Missing user data after lookup');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch profile data from profiles table
    console.log('Fetching profile data for user ID:', userId);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, company, phone')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.warn('Profile data not found:', profileError.message);
    } else {
      console.log('Profile data retrieved:', profileData);
    }
    
    try {
      // Construct complete user object combining auth data and profile data
      const user = {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        role: profileData?.role || authUser.role || 'user',
        full_name: profileData?.full_name || '',
        company: profileData?.company || '',
        phone: profileData?.phone || '',
      };
      
      console.log('Returning complete user data:', user.email, user.role);
      return NextResponse.json(user);
    } catch (err) {
      console.error('Error constructing user data:', err);
      return NextResponse.json({ error: 'Failed to process user data' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in GET /api/users/[id]:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;
    const body = await request.json();
    const { email, full_name, company, phone, role } = body;

    console.log('Processing update for user:', userId);
    console.log('Update data:', { email, full_name, company, phone, role });
    
    const supabase = createAdminSupabase();

    // First check if the profiles table is properly set up with a record for this user
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    console.log('Existing profile check:', { exists: !!existingProfile, error: profileLookupError?.message });
    
    // If profile doesn't exist, create one
    if (profileLookupError && profileLookupError.message.includes('No rows found')) {
      console.log('Profile not found, creating new profile');
      
      // First check if user exists in auth or users table
      const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(userId);
      const userExists = !!existingUser?.user;
      
      // Also check the public.users table
      const { data: publicUser, error: publicUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
        
      const publicUserExists = !!publicUser;
      
      console.log('User existence check:', { 
        authUser: userExists,
        publicUser: publicUserExists
      });
      
      if (userExists || publicUserExists) {
        // Try to create a new profile
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name,
            company,
            phone,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
          
        console.log('Profile creation result:', { 
          success: !!newProfile, 
          error: createProfileError?.message
        });
      }
    } else if (existingProfile) {
      // Profile exists, update it
      console.log('Updating existing profile:', existingProfile.id);
      
      const updateData = { 
        full_name, 
        company, 
        phone, 
        role, 
        updated_at: new Date().toISOString() 
      };
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select();
        
      console.log('Profile update result:', { 
        success: !!updatedProfile, 
        error: updateError?.message,
        data: updatedProfile
      });
    }
    
    // Update email in auth system if changed and user exists in auth
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (existingUser && existingUser.user && email && email !== existingUser.user.email) {
      console.log('Updating email in auth from', existingUser.user.email, 'to', email);
      
      const { error } = await supabase.auth.admin.updateUserById(userId, { email });
      if (error) {
        console.error('Failed to update email:', error);
        return NextResponse.json({ error: `Failed to update email: ${error.message}` }, { status: 500 });
      }
    }
    
    // Also update email in public.users table if it exists
    const { error: usersUpdateError } = await supabase
      .from('users')
      .update({ 
        email,
        role,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
      
    if (usersUpdateError && !usersUpdateError.message.includes('no rows')) {
      console.warn('Error updating public.users table:', usersUpdateError);
    }

    // Return the updated user data
    return NextResponse.json({ 
      id: userId,
      email, 
      full_name, 
      company, 
      phone, 
      role 
    });
  } catch (error: any) {
    console.error('Error in PUT /api/users/[id]:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;

    const supabase = createAdminSupabase();
    
    // Check if user exists before trying to delete
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError && userError.message !== "User not found") {
      return NextResponse.json({ error: `Failed to check user: ${userError.message}` }, { status: 500 });
    }

    // Try to delete from profiles table, but continue if there's an error
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (profileError) {
      console.warn(`Error deleting from profiles table (continuing anyway): ${profileError}`);
      // Continue even if profiles table doesn't exist or other errors occur
    }
    
    // Delete from public.users table
    const { error: userDeleteError } = await supabase.from('users').delete().eq('id', userId);
    if (userDeleteError) {
      console.warn(`Error deleting from users table: ${userDeleteError.message}`);
    }
    
    // If the user exists in the auth system, delete them there too
    if (existingUser?.user) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        return NextResponse.json({ error: `Failed to delete user from auth: ${authDeleteError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/users/[id]:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
} 