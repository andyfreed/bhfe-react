import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Verify admin authorization
async function verifyAdminAuth() {
  // Allow everything in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    // This would normally check if the token is valid
    return !!token;
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return false;
  }
}

// POST: Fix a user by email
export async function POST(request: NextRequest) {
  try {
    console.log('Starting fix user operation...');
    
    // Verify admin authorization
    if (!(await verifyAdminAuth())) {
      console.log('Unauthorized attempt to fix user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const userEmail = body?.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    console.log(`Attempting to fix user with email: ${userEmail}`);
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Find the user in the auth system
    console.log('Finding user in auth system...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error finding user in auth system:', authError);
      return NextResponse.json({ error: `Failed to find user in auth system: ${authError.message}` }, { status: 500 });
    }
    
    // Manually filter users by email
    const matchingUsers = authUsers?.users?.filter(user => 
      user.email?.toLowerCase() === userEmail.toLowerCase()
    );
    
    if (!matchingUsers || matchingUsers.length === 0) {
      console.warn('User not found in auth system');
      return NextResponse.json({ error: 'User not found in auth system' }, { status: 404 });
    }
    
    const authUser = matchingUsers[0];
    console.log(`Found user in auth system with ID: ${authUser.id}`);
    
    // Step 2: Check if user exists in the users table by ID
    console.log('Checking user in users table by ID...');
    const { data: existingUserById, error: existingError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    // Step 2.5: Also check if a user with the same email exists in the users table
    console.log('Checking user in users table by email...');
    const { data: existingUserByEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', userEmail)
      .single();
    
    // If user with same email exists but has a different ID
    if (existingUserByEmail && existingUserByEmail.id !== authUser.id) {
      console.log(`User exists with same email but different ID: ${existingUserByEmail.id} vs ${authUser.id}`);
      
      // Get user's role from the profile if it exists
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', existingUserByEmail.id)
        .single();
      
      const userRole = userProfile?.role || existingUserByEmail.role || 'user';
      console.log(`Using role: ${userRole} for user update`);
      
      // Update the user in the users table with the auth user ID
      const { error: updateError } = await supabase
        .from('users')
        .update({
          id: authUser.id,
          updated_at: new Date().toISOString(),
          role: userRole // Use existing role from profile or user table
        })
        .eq('email', userEmail);
      
      if (updateError) {
        console.error(`Error updating user ID: ${updateError.message}`);
        
        // If we can't update (likely due to foreign key constraints), try to delete and re-create
        console.log('Attempting to delete user and re-create with correct ID');
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', existingUserByEmail.id);
          
        if (deleteError) {
          console.error(`Error deleting user: ${deleteError.message}`);
          return NextResponse.json({
            error: `Failed to update user: ${deleteError.message}`
          }, { status: 500 });
        }
        
        // Now insert the user with the correct ID
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: userProfile?.role || existingUserByEmail.role || 'user' // Use role from profile or user table
          });
          
        if (insertError) {
          console.error(`Error inserting user after delete: ${insertError.message}`);
          return NextResponse.json({
            error: `Failed to re-create user: ${insertError.message}`
          }, { status: 500 });
        }
        
        console.log('Successfully re-created user with correct ID');
        
        // Update profile if it exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', existingUserByEmail.id)
          .single();
          
        if (existingProfile) {
          console.log(`Found profile for old user ID, updating to match new ID`);
          
          // Try to update the profile ID
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ id: authUser.id })
            .eq('id', existingUserByEmail.id);
            
          if (updateProfileError) {
            console.log(`Error updating profile ID: ${updateProfileError.message}, creating new profile`);
            
            // If update fails, create a new profile
            const { error: createProfileError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                role: existingProfile.role || 'user',
                full_name: existingProfile.full_name,
                company: existingProfile.company,
                phone: existingProfile.phone,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (createProfileError) {
              console.error(`Error creating new profile: ${createProfileError.message}`);
            } else {
              console.log('Created new profile with correct ID');
            }
          } else {
            console.log('Updated profile ID successfully');
          }
        }
      } else {
        console.log('Successfully updated user ID');
        
        // Update any associated profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', existingUserByEmail.id)
          .single();
          
        if (existingProfile) {
          console.log(`Found profile for old user ID, updating to match new ID`);
          
          // Try to update the profile ID
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ id: authUser.id })
            .eq('id', existingUserByEmail.id);
            
          if (updateProfileError) {
            console.log(`Error updating profile ID: ${updateProfileError.message}, creating new profile`);
            
            // If update fails, create a new profile
            const { error: createProfileError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                role: existingProfile.role || 'user',
                full_name: existingProfile.full_name,
                company: existingProfile.company,
                phone: existingProfile.phone,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (createProfileError) {
              console.error(`Error creating new profile: ${createProfileError.message}`);
            } else {
              console.log('Created new profile with correct ID');
            }
          } else {
            console.log('Updated profile ID successfully');
          }
        }
      }
    }
    // If user doesn't exist in users table by ID and there's no duplicate by email
    else if (!existingUserById && !existingUserByEmail) {
      console.log('User not found in users table, creating...');
      
      // Insert the user into the users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: 'user' // Set default role
        });
      
      if (insertError) {
        console.error('Error creating user in users table:', insertError);
        return NextResponse.json({
          error: `Failed to create user in users table: ${insertError.message}`
        }, { status: 500 });
      }
      
      console.log('Successfully created user in users table');
    } else {
      console.log('User already exists in users table');
      
      // Ensure the role is consistent in the users table
      if (existingUserById) {
        // Get user's role from the profile if it exists
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();
          
        if (userProfile?.role && userProfile.role !== existingUserById.role) {
          console.log(`Updating user role from ${existingUserById.role} to ${userProfile.role}`);
          
          // Update the role in the users table
          const { error: updateRoleError } = await supabase
            .from('users')
            .update({
              role: userProfile.role,
              updated_at: new Date().toISOString()
            })
            .eq('id', authUser.id);
            
          if (updateRoleError) {
            console.error(`Error updating user role: ${updateRoleError.message}`);
          } else {
            console.log('Successfully updated user role');
          }
        }
      }
    }
    
    // Step 3: Check if user has a profile
    console.log('Checking if user has a profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking for profile:', profileError);
      // Continue anyway, this is not a critical error
    }
    
    if (!profile) {
      console.log('Profile not found, creating...');
      
      // Create a profile for the user
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          role: 'user', // Default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        return NextResponse.json({
          error: `Failed to create profile: ${createProfileError.message}`,
          user: existingUserById || existingUserByEmail || 'Created'
        }, { status: 500 });
      }
      
      console.log('Successfully created profile');
    } else {
      console.log('User already has a profile');
    }
    
    return NextResponse.json({
      message: 'User fixed successfully',
      user: {
        id: authUser.id,
        email: authUser.email,
        exists_in_users: !!existingUserById || !!existingUserByEmail,
        exists_in_profiles: !!profile
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Server error during fix user operation:', error);
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