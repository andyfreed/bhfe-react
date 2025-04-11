import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We're now handling authentication entirely client-side
  // This middleware file is kept for future server-side auth implementation
  return NextResponse.next();
}

export const config = {
  // Keep the matcher to ensure this middleware runs only for admin routes
  matcher: ['/admin/:path*'],
}; 