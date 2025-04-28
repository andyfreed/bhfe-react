import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple admin login endpoint
export async function POST(request: NextRequest) {
  console.log('Admin auth API called');
  
  try {
    // Parse the request body
    let tokenData;
    try {
      tokenData = await request.json();
      console.log('Received token request', { hasToken: !!tokenData.token });
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { token } = tokenData;
    
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    // Check if token is valid
    const isDevelopment = process.env.NODE_ENV === 'development';
    console.log('Environment:', process.env.NODE_ENV);
    
    const devTokenValid = isDevelopment && token === 'super-secure-admin-token-for-development';
    const prodTokenValid = token === process.env.ADMIN_TOKEN;
    
    console.log('Token validation:', { 
      isDevelopment, 
      devTokenValid: isDevelopment ? devTokenValid : 'N/A',
      prodTokenValid: !!prodTokenValid,
    });
    
    const isValidToken = devTokenValid || prodTokenValid;
    
    if (!isValidToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Set the cookie directly using Response
    const response = NextResponse.json({ success: true });
    
    // Set the cookie in the response
    response.cookies.set({
      name: 'admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 24, // 24 hours
      path: '/'
    });
    
    console.log('Authentication successful, cookie set in response');
    return response;
  } catch (error) {
    console.error('Error in admin auth:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Server error' 
    }, { status: 500 });
  }
} 