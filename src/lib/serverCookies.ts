/**
 * Server-side cookie utilities
 * IMPORTANT: Only use these functions in server components or server actions
 */

import { cookies } from 'next/headers';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

/**
 * Get a cookie value from the server
 * This must be used within a Server Component or Server Action
 */
export async function getServerCookie(name: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch (error) {
    console.error(`Server: Error getting cookie ${name}:`, error);
    return undefined;
  }
}

/**
 * Set a cookie on the server
 * This must be used within a Server Component or Server Action
 */
export async function setServerCookie(name: string, value: string, options?: CookieOptions): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      ...options
    });
  } catch (error) {
    console.error(`Server: Error setting cookie ${name}:`, error);
  }
}

/**
 * Delete a cookie on the server
 * This must be used within a Server Component or Server Action
 */
export async function deleteServerCookie(name: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(name);
  } catch (error) {
    console.error(`Server: Error deleting cookie ${name}:`, error);
  }
}

/**
 * Check if a token is valid for admin access
 */
export function isValidAdminToken(token?: string): boolean {
  console.log('[isValidAdminToken] Checking token:', token);
  console.log('[isValidAdminToken] NODE_ENV:', process.env.NODE_ENV);
  
  if (!token) {
    console.log('[isValidAdminToken] No token provided');
    return false;
  }
  
  // Accept our development tokens in dev mode
  const isDevelopmentToken = (token === 'super-secure-admin-token-for-development' || 
                             token === 'temporary-token') && 
                           process.env.NODE_ENV === 'development';
  
  console.log('[isValidAdminToken] isDevelopmentToken:', isDevelopmentToken);
  
  if (isDevelopmentToken) {
    console.log('[isValidAdminToken] Using development token');
    return true;
  }
  
  // Check against our environment variable
  const validToken = process.env.ADMIN_TOKEN;
  console.log('[isValidAdminToken] ENV token:', validToken);
  console.log('[isValidAdminToken] Match env token:', token === validToken);
  
  return token === validToken;
}

/**
 * Get the admin token from cookies (server-side)
 * This must be used within a Server Component or Server Action
 */
export async function getServerAdminToken(): Promise<string | undefined> {
  return getServerCookie('admin_token');
}

/**
 * Set the admin token in cookies (server-side)
 * This must be used within a Server Component or Server Action
 */
export async function setServerAdminToken(): Promise<void> {
  const token = process.env.NODE_ENV === 'development' 
    ? 'super-secure-admin-token-for-development'
    : process.env.ADMIN_TOKEN || 'temporary-token';
    
  await setServerCookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600 * 24, // 24 hours
    path: '/'
  });
} 