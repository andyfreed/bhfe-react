import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Verify admin authorization - same function as in other admin endpoints
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

// POST: Sync users from auth to users table
export async function POST(request: NextRequest) {
  try {
    console.log('Starting user sync operation...');
    
    // Verify admin authorization
    if (!(await verifyAdminAuth())) {
      console.log('Unauthorized attempt to sync users');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch all users from auth system
    console.log('Fetching users from auth system...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({ error: `Failed to fetch auth users: ${authError.message}` }, { status: 500 });
    }
    
    if (!authUsers || !authUsers.users) {
      console.warn('No users found in auth system');
      return NextResponse.json({ message: 'No users found to sync' }, { status: 200 });
    }
    
    console.log(`Found ${authUsers.users.length} users in auth system`);
    
    // Fetch existing users from the users table
    const { data: existingUsers, error: existingError } = await supabase
      .from('users')
      .select('id, email');
    
    if (existingError) {
      console.error('Error fetching existing users:', existingError);
      return NextResponse.json(
        { error: `Failed to fetch existing users: ${existingError.message}` },
        { status: 500 }
      );
    }
    
    // Create maps for quick lookups
    const existingUserIdMap = new Map();
    const existingUserEmailMap = new Map();
    
    if (existingUsers) {
      existingUsers.forEach(user => {
        existingUserIdMap.set(user.id, user);
        if (user.email) {
          existingUserEmailMap.set(user.email.toLowerCase(), user);
        }
      });
    }
    
    console.log(`Found ${existingUserIdMap.size} users in users table`);
    
    // Track sync results
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    // Process each auth user and ensure they exist in users table
    for (const authUser of authUsers.users) {
      if (!authUser.id || !authUser.email) {
        console.warn('Skipping user with missing ID or email:', authUser.id);
        continue;
      }
      
      const email = authUser.email.toLowerCase();
      
      // Check if user already exists in users table by ID
      if (existingUserIdMap.has(authUser.id)) {
        // User exists with matching ID, check if email needs to be updated
        const existingUser = existingUserIdMap.get(authUser.id);
        if (existingUser.email.toLowerCase() !== email) {
          console.log(`Updating email for user ${authUser.id} from ${existingUser.email} to ${authUser.email}`);
          
          // Update the email address
          const { error: updateError } = await supabase
            .from('users')
            .update({
              email: authUser.email,
              updated_at: new Date().toISOString(),
              role: existingUserIdMap.get(authUser.id)?.role || authUser.role || 'user'
            })
            .eq('id', authUser.id);
          
          if (updateError) {
            console.error(`Error updating email for user ${authUser.id}:`, updateError);
            errors++;
          } else {
            updated++;
          }
        }
      } 
      // Check if user exists with different ID but same email
      else if (existingUserEmailMap.has(email)) {
        const existingUser = existingUserEmailMap.get(email);
        console.log(`User with email ${authUser.email} exists with different ID: ${existingUser.id} vs ${authUser.id}`);
        
        // Try to update the ID of the existing user to match the auth ID
        const { error: updateError } = await supabase
          .from('users')
          .update({
            id: authUser.id,
            email: authUser.email,
            updated_at: new Date().toISOString(),
            role: existingUserIdMap.get(authUser.id)?.role || authUser.role || 'user'
          })
          .eq('email', email);
        
        if (updateError) {
          console.error(`Error updating ID for user ${existingUser.id}:`, updateError);
          
          // If we can't update, try to delete and insert
          console.log(`Attempting to delete user ${existingUser.id} and insert with correct ID`);
          
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', existingUser.id);
            
          if (deleteError) {
            console.error(`Error deleting user ${existingUser.id}:`, deleteError);
            errors++;
            continue;
          }
          
          // Insert with correct ID
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              created_at: authUser.created_at || new Date().toISOString(),
              last_sign_in_at: authUser.last_sign_in_at,
              role: existingUserIdMap.get(authUser.id)?.role || authUser.role || 'user'
            });
            
          if (insertError) {
            console.error(`Error inserting user ${authUser.email} after delete:`, insertError);
            errors++;
          } else {
            created++;
            
            // Check if profile needs to be updated too
            const { data: oldProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', existingUser.id)
              .single();
              
            if (oldProfile) {
              // Update profile ID
              const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({
                  id: authUser.id
                })
                .eq('id', existingUser.id);
                
              if (updateProfileError) {
                // Create new profile
                await supabase
                  .from('profiles')
                  .insert({
                    id: authUser.id,
                    role: oldProfile.role || 'user',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });
              }
            }
          }
        } else {
          updated++;
          
          // Check if profile needs to be updated too
          const { data: oldProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', existingUser.id)
            .single();
            
          if (oldProfile) {
            // Update profile ID
            const { error: updateProfileError } = await supabase
              .from('profiles')
              .update({
                id: authUser.id
              })
              .eq('id', existingUser.id);
              
            if (updateProfileError) {
              // Create new profile
              await supabase
                .from('profiles')
                .insert({
                  id: authUser.id,
                  role: oldProfile.role || 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
            }
          }
        }
      } 
      // User doesn't exist at all, insert new record
      else {
        console.log(`Adding user ${authUser.email} to users table`);
        
        // Insert the user into the users table without the role field
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at || new Date().toISOString(),
            last_sign_in_at: authUser.last_sign_in_at,
            role: authUser.role || 'user'
          });
        
        if (insertError) {
          console.error(`Error syncing user ${authUser.email}:`, insertError);
          errors++;
        } else {
          created++;
          
          // Also ensure profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', authUser.id)
            .single();
            
          if (!existingProfile) {
            // Create profile if it doesn't exist
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (profileError) {
              console.warn(`Created user ${authUser.email} but couldn't create profile:`, profileError);
            } else {
              console.log(`Created profile for user ${authUser.email}`);
            }
          }
        }
      }
    }
    
    console.log(`Sync complete: Created ${created} users, updated ${updated}, encountered ${errors} errors`);
    
    return NextResponse.json({
      message: `Sync complete: Added ${created} users, updated ${updated} users`,
      created,
      updated,
      errors
    }, { status: 200 });
  } catch (error: any) {
    console.error('Server error during user sync:', error);
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