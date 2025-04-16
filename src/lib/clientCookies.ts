/**
 * Client-side cookie utilities
 * IMPORTANT: Only use these functions in client components, not in server components
 */

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
 * Clear the admin token (client-side)
 */
export function clearAdminToken(): void {
  deleteCookie('admin_token');
} 