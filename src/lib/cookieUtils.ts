/**
 * WARNING: This file is for backward compatibility only.
 * Use clientCookies.ts for client components and serverCookies.ts for server components
 * to avoid importing 'next/headers' in client components.
 */

// Re-export client-side cookie utilities
export {
  setCookie,
  getCookie,
  deleteCookie,
  hasAdminCookie,
  isValidAdminToken,
  setAdminToken,
  clearAdminToken
} from './clientCookies'; 