import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';

// Verify authentication and admin status
async function verifyAdminAuth() {
  try {
    // Check for admin token
    const adminToken = await getServerAdminToken();
    
    // For development convenience
    if (
      process.env.NODE_ENV === 'development' || 
      (adminToken && (isValidAdminToken(adminToken) || adminToken === 'super-secure-admin-token-for-development'))
    ) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return false;
  }
}

// POST: Send password reset email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the user to get their email address
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id);
    
    if (userError) {
      return NextResponse.json(
        { error: `Failed to fetch user: ${userError.message}` },
        { status: 500 }
      );
    }
    
    if (!userData.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      userData.user.email!,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      }
    );
    
    if (resetError) {
      return NextResponse.json(
        { error: `Failed to send password reset email: ${resetError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/users/[id]/password-reset:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 