/**
 * Admin authentication utilities for API routes
 */

import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';
import { createServerSupabaseClient } from '@/lib/supabase';

// Mock client disabled – always use live Supabase
const useMockClient = false;

/**
 * Checks for an admin token and returns a fixed admin user ID if valid
 * If no valid admin token is found, returns null
 */
export async function checkAdminAccess(): Promise<string | null> {
  try {
    // Check for admin token
    const adminToken = await getServerAdminToken();
    console.log('Admin token check:', adminToken);
    
    if (adminToken && isValidAdminToken(adminToken)) {
      console.log('Valid admin token found - using admin user ID');
      return 'admin-user-id';
    }
    
    return null;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return null;
  }
}

/**
 * Gets the user ID either from admin token or from Supabase auth
 * Returns null if neither is available
 */
export async function getUserId(): Promise<string | null> {
  try {
    // First check for admin access
    const adminUserId = await checkAdminAccess();
    if (adminUserId) return adminUserId;
    
    // Otherwise try to get the user ID from Supabase auth
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    return session?.user?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Safely handles a mock response or a real Supabase response
 * This helps overcome TypeScript errors with our mock Supabase implementation
 */
export function safeResponse<T>(response: any): { data: T | null; error: any | null } {
  if (!response) {
    return { data: null, error: new Error('No response received') };
  }
  
  // Handle mock responses
  if (useMockClient) {
    if (response.data !== undefined) {
      return response; // It's already in the right format
    }
    
    // For other responses that might be promises in mock mode
    return { data: null, error: null };
  }
  
  // Handle normal Supabase responses
  return response;
} 