import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verifies if the current user has admin access
 * @param supabase - The Supabase client instance
 * @returns boolean indicating if user has admin access
 */
export async function verifyAdminAccess(supabase: SupabaseClient): Promise<boolean> {
  try {
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user or no user found:', userError);
      return false;
    }
    
    // Query the profiles table to check if the user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return false;
    }
    
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return false;
  }
}

/**
 * Verifies if the user is authenticated
 * @param supabase - The Supabase client instance
 * @returns The user object if authenticated, null otherwise
 */
export async function getAuthenticatedUser(supabase: SupabaseClient) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Checks if the user has access to a specific resource
 * @param supabase - The Supabase client instance
 * @param resourceUserId - The user ID associated with the resource
 * @returns boolean indicating if user has access
 */
export async function verifyResourceAccess(
  supabase: SupabaseClient,
  resourceUserId: string
): Promise<boolean> {
  try {
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return false;
    }
    
    // Check if the user is an admin
    const isAdmin = await verifyAdminAccess(supabase);
    
    // Admin has access to all resources
    if (isAdmin) {
      return true;
    }
    
    // Check if the resource belongs to the user
    return user.id === resourceUserId;
  } catch (error) {
    console.error('Error verifying resource access:', error);
    return false;
  }
} 