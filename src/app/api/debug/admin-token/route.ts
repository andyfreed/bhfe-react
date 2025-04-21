import { NextRequest, NextResponse } from 'next/server';
import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';

export async function GET(request: NextRequest) {
  try {
    // Check for admin token
    const adminToken = getServerAdminToken();
    console.log('Admin token from cookie:', adminToken);
    
    // Check if token is valid
    const isValid = isValidAdminToken(adminToken);
    console.log('Is token valid?', isValid);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    return NextResponse.json({
      adminToken: adminToken || null,
      isValid,
      nodeEnv: process.env.NODE_ENV,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in admin token debug endpoint:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 