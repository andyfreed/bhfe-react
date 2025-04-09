import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

export async function validateAdmin(supabase?: SupabaseClient): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    // Use a secure token comparison in production
    if (!token || token.value !== 'temporary-token') {
      console.error('Authentication failed: Token missing or invalid');
      return false;
    }
    
    console.log('Authentication successful');
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

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