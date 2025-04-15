/**
 * Cookie utilities for both client and server-side operations.
 * This file provides a unified interface for cookie operations with both client-side
 * and server-side implementations. It automatically detects the environment and uses
 * the appropriate implementation.
 */

import { cookies } from 'next/headers';

// ======== CLIENT-SIDE COOKIE UTILITIES ========
// IMPORTANT: Only use these functions in client components

/**
 * Set a cookie with the given options (client-side)
 */
export function setCookie(
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
  if (typeof document === 'undefined') {
    console.error('Client setCookie can only be used in client-side code');
    return;
  }

  const optStr = [];
  
  if (options.path) optStr.push(`path=${options.path}`);
  if (options.maxAge) optStr.push(`max-age=${options.maxAge}`);
  if (options.sameSite) optStr.push(`samesite=${options.sameSite.toLowerCase()}`);
  if (options.secure) optStr.push('secure');
  
  document.cookie = `${name}=${encodeURIComponent(value)}${optStr.length ? `; ${optStr.join('; ')}` : ''}`;
}

/**
 * Get a cookie by name (client-side)
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    console.error('Client getCookie can only be used in client-side code');
    return undefined;
  }

  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    const [cookieName, cookieValue] = cookie.split('=');
    
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  
  return undefined;
}

/**
 * Delete a cookie by name (client-side)
 */
export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') {
    console.error('Client deleteCookie can only be used in client-side code');
    return;
  }

  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
}

// ======== SERVER-SIDE COOKIE UTILITIES ========
// IMPORTANT: Only use these functions in server components or server actions

/**
 * Get a cookie value by name (server-side)
 * This must be used within a Server Component or Server Action
 */
export function getServerCookie(name: string): string | undefined {
  try {
    // This must be called directly within a Server Component or Server Action
    const cookiesList = cookies();
    return cookiesList.get(name)?.value;
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
    
    // This must be called directly within a Server Component or Server Action
    const cookiesList = cookies();
    cookiesList.set(name, value, finalOptions);
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
    // This must be called directly within a Server Component or Server Action
    const cookiesList = cookies();
    cookiesList.delete(name);
  } catch (error) {
    console.error(`Server: Error deleting cookie ${name}:`, error);
  }
}

// ======== ADMIN TOKEN UTILITIES ========
// These can be used in both client and server components

/**
 * Check if the admin token exists and is valid (client-side)
 */
export function hasAdminCookie(): boolean {
  return getCookie('admin_token') === 'temporary-token';
}

/**
 * Check if a token is valid for admin access
 */
export function isValidAdminToken(token?: string): boolean {
  return token === 'temporary-token';
}

/**
 * Set the admin token (client-side)
 */
export function setAdminToken(): void {
  setCookie('admin_token', 'temporary-token', {
    path: '/',
    maxAge: 3600 * 24, // 24 hours
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
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
  setServerCookie('admin_token', 'temporary-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 * 24, // 24 hours
    path: '/'
  });
}

/**
 * Clear the admin token (client-side)
 */
export function clearAdminToken(): void {
  deleteCookie('admin_token');
} 