import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseClient } from '@supabase/supabase-js';

// Define result types
type ResultDetail = {
  id: string;
  email?: string;
  status: 'skipped' | 'error' | 'updated' | 'consistent';
  reason?: string;
  message?: string;
  oldRole?: string;
  newRole?: string;
  role?: string;
};

type SyncResults = {
  total: number;
  updated: number;
  errors: number;
  details: ResultDetail[];
};

// Verify admin authorization - always allows in development mode
async function verifyAdminAuth(supabase: SupabaseClient) {
  // Allow all actions in development mode
  if (process.env.NODE_ENV === 'development') {
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

    console.log('Starting role synchronization between profiles and users tables');
    
    // Get all users from the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role');
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError.message },
        { status: 500 }
      );
    }
    
    console.log(`Found ${profiles?.length || 0} profiles in the profiles table`);
    
    // Process each profile to ensure role consistency
    const results: SyncResults = {
      total: profiles?.length || 0,
      updated: 0,
      errors: 0,
      details: []
    };
    
    if (profiles) {
      for (const profile of profiles) {
        try {
          // Check if user exists in users table
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('id', profile.id)
            .single();
            
          if (userError) {
            console.log(`User with ID ${profile.id} not found in users table. Skipping.`);
            results.details.push({
              id: profile.id,
              status: 'skipped',
              reason: `User not found in users table: ${userError.message}`
            });
            continue;
          }
          
          // If roles are different, update the role in the users table
          if (user.role !== profile.role) {
            console.log(`Role mismatch for user ${user.id} (${user.email}): users table=${user.role}, profiles table=${profile.role}`);
            
            const { error: updateError } = await supabase
              .from('users')
              .update({
                role: profile.role,
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.id);
              
            if (updateError) {
              console.error(`Error updating role for user ${profile.id}:`, updateError.message);
              results.errors++;
              results.details.push({
                id: profile.id,
                email: user.email,
                status: 'error',
                message: `Failed to update role: ${updateError.message}`
              });
            } else {
              console.log(`Successfully updated role for user ${profile.id} from ${user.role} to ${profile.role}`);
              results.updated++;
              results.details.push({
                id: profile.id,
                email: user.email,
                status: 'updated',
                oldRole: user.role,
                newRole: profile.role
              });
            }
          } else {
            console.log(`Roles already consistent for user ${profile.id}: ${profile.role}`);
            results.details.push({
              id: profile.id,
              email: user.email,
              status: 'consistent',
              role: profile.role
            });
          }
        } catch (error) {
          console.error(`Unexpected error processing user ${profile.id}:`, error instanceof Error ? error.message : String(error));
          results.errors++;
          results.details.push({
            id: profile.id,
            status: 'error',
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    
    console.log(`Role synchronization complete. Updated ${results.updated} of ${results.total} users. Errors: ${results.errors}`);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in sync-roles route:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to sync roles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 