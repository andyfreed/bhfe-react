/**
 * Server-side cookie utilities
 * IMPORTANT: Only use these functions in server components or server actions
 */

import { cookies } from 'next/headers';

/**
 * Get a cookie value by name (server-side)
 * This must be used within a Server Component or Server Action
 */
export function getServerCookie(name: string): string | undefined {
  try {
    const cookieStore = cookies();
    return cookieStore.get(name)?.value;
  } catch (error) {
    console.error(`Server: Error getting cookie ${name}:`, error);
    return undefined;
  }
}

/**
 * Set a cookie with the given options (server-side)
 * This must be used within a Server Component or Server Action
 */
export function setServerCookie(
  name: string, 
  value: string, 
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
  } = {}
): void {
  try {
    // Make sure path is set to root by default
    const finalOptions = {
      ...options,
      path: options.path || '/',
    };
    
    const cookieStore = cookies();
    cookieStore.set(name, value, finalOptions);
  } catch (error) {
    console.error(`Server: Error setting cookie ${name}:`, error);
  }
}

/**
 * Delete a cookie by name (server-side)
 * This must be used within a Server Component or Server Action
 */
export function deleteServerCookie(name: string): void {
  try {
    const cookieStore = cookies();
    cookieStore.delete(name);
  } catch (error) {
    console.error(`Server: Error deleting cookie ${name}:`, error);
  }
}

/**
 * Check if a token is valid for admin access
 */
export function isValidAdminToken(token?: string): boolean {
  return token === 'temporary-token' || token === 'allowed';
}

/**
 * Get the admin token from cookies (server-side)
 * This must be used within a Server Component or Server Action
 */
export function getServerAdminToken(): string | undefined {
  return getServerCookie('admin_token');
}

/**
 * Set the admin token in cookies (server-side)
 * This must be used within a Server Component or Server Action
 */
export function setServerAdminToken(): void {
  setServerCookie('admin_token', 'allowed', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 * 24, // 24 hours
    path: '/'
  });
} 