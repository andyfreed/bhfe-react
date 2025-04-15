import { SupabaseClient } from '@supabase/supabase-js';
import { isUserAdmin } from './auth';
import { cookies } from 'next/headers';

/**
 * Server-only function to validate admin status
 */
export async function validateAdmin(): Promise<boolean> {
  try {
    // Get the cookie directly
    const cookiesList = cookies();
    const token = cookiesList.get('admin_token')?.value;
    return token === 'temporary-token';
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

/**
 * Set admin token directly
 */
export function setDirectAdminToken(): void {
  const cookieStore = cookies();
  cookieStore.set('admin_token', 'temporary-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600 * 24, // 24 hours
    path: '/'
  });
}

/**
 * Server-side function to check if a user is an admin by their Supabase session
 */
export async function checkAndSetAdminBySession(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
      
    if (data.session?.user?.email) {
      const admin = await isUserAdmin(data.session.user.email);
      
      // If the logged in user is an admin, set the admin token
      if (admin) {
        setDirectAdminToken();
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin session:', error);
    return false;
  }
} 