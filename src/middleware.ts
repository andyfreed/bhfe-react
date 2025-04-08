import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the path
  const path = request.nextUrl.pathname;
  
  // Check if the path starts with /admin
  if (path.startsWith('/admin') && path !== '/admin/login') {
    // Get the token from cookies
    const token = request.cookies.get('admin_token')?.value;
    
    // If there's no token, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 