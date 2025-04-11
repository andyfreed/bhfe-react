import { cookies } from 'next/headers';

/**
 * React Server Component utilities for cookies
 * IMPORTANT: Only use this in server components or server actions
 */

/**
 * Get a cookie value by name
 */
export async function getCookie(name: string): Promise<string | undefined> {
  try {
    // Directly convert to object to avoid async issues
    const cookieObj = Object.fromEntries(cookies().getAll().map(c => [c.name, c.value]));
    return cookieObj[name];
  } catch (error) {
    console.error(`RSC: Error getting cookie ${name}:`, error);
    return undefined;
  }
}

/**
 * Set a cookie with the given options
 */
export async function setCookie(
  name: string, 
  value: string, 
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
  } = {}
): Promise<void> {
  try {
    // Make sure path is set to root by default
    const finalOptions = {
      ...options,
      path: options.path || '/',
    };
    
    // Get the cookie handler directly, not as a Promise
    cookies().set(name, value, finalOptions);
  } catch (error) {
    console.error(`RSC: Error setting cookie ${name}:`, error);
  }
}

/**
 * Check if a token is valid for admin access
 */
export function isValidAdminToken(token?: string): boolean {
  return token === 'temporary-token';
}

/**
 * Get the admin token from cookies
 */
export async function getAdminToken(): Promise<string | undefined> {
  return await getCookie('admin_token');
}

/**
 * Set the admin token in cookies
 */
export async function setAdminToken(): Promise<void> {
  await setCookie('admin_token', 'temporary-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 * 24, // 24 hours
    path: '/'
  });
} 