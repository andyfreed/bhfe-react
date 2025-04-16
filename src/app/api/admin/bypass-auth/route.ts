import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// WARNING: This is ONLY for development purposes
export async function POST(request: NextRequest) {
  // ONLY allow this in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const { secret } = await request.json();

    // Simple secret check (very basic, only for dev)
    if (secret !== 'admin-dev-bypass') {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Set a cookie to indicate admin bypass
    const response = NextResponse.json({
      success: true,
      message: 'Admin auth bypassed for development'
    });
    
    // Add the admin bypass cookie to the response
    response.cookies.set('admin-dev-mode', 'true', { 
      path: '/',
      maxAge: 60 * 60, // 1 hour
      httpOnly: false // Make it readable by client
    });

    return response;
  } catch (error: any) {
    console.error('Error in bypass auth:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 