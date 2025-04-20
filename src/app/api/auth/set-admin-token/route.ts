import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Set admin token cookie
    const cookieStore = cookies();
    cookieStore.set('admin_token', 'allowed', {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 24, // 24 hours
      path: '/'
    });
    
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error setting admin token:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to set admin token' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 