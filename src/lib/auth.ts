import { SupabaseClient } from '@supabase/supabase-js';

// Client-safe function for getting user ID
export async function getUserId(supabase: SupabaseClient): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Error in getUserId:', error);
    return null;
  }
}

/**
 * Check if the current user is an admin based on their email
 * This is client-safe
 */
export async function isUserAdmin(email: string): Promise<boolean> {
  // List of admin emails
  const adminEmails = ['a.freed@outlook.com'];
  return adminEmails.includes(email.toLowerCase());
} 