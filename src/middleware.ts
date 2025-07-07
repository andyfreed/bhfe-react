import { NextResponse } from 'next/server';

export function middleware() {
  // We're now handling authentication entirely client-side
  // This middleware file is kept for future server-side auth implementation
  return NextResponse.next();
}

export const config = {
  // Keep the matcher to ensure this middleware runs only for admin routes
  matcher: ['/admin/:path*'],
}; 