/**
 * Client-side cookie utilities
 * IMPORTANT: Only use this in client components, not in server components
 */

/**
 * Set a cookie with the given options
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
    console.error('setCookie can only be used in client-side code');
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
 * Get a cookie by name
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    console.error('getCookie can only be used in client-side code');
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
 * Delete a cookie by name
 */
export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') {
    console.error('deleteCookie can only be used in client-side code');
    return;
  }

  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
}

/**
 * Check if the admin token exists and is valid
 */
export function hasAdminCookie(): boolean {
  return getCookie('admin_token') === 'temporary-token';
}

/**
 * Set the admin token
 */
export function setAdminToken(): void {
  setCookie('admin_token', 'temporary-token', {
    path: '/',
    maxAge: 3600, // 1 hour
    sameSite: 'strict'
  });
}

/**
 * Clear the admin token
 */
export function clearAdminToken(): void {
  deleteCookie('admin_token');
} 