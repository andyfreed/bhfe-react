import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/auth';
import { setServerAdminToken } from '@/lib/serverCookies';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user - this will check the Supabase auth cookies
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('Set session - user check:', { userId: user?.id, email: user?.email, error: error?.message });
    
    if (error || !user || !user.email) {
      // Try to get more info about the auth state
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Set session - session check:', { hasSession: !!session, sessionUser: session?.user?.email });
      
      return NextResponse.json({ 
        error: 'Not authenticated',
        details: 'No valid Supabase session found. Please log in first.',
        hasUser: !!user,
        hasSession: !!session
      }, { status: 401 });
    }
    
    // Check if user is admin
    const isAdmin = await isUserAdmin(user.email);
    
    console.log('Set session - admin check:', { email: user.email, isAdmin });
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Not authorized',
        details: `User ${user.email} does not have admin role`
      }, { status: 403 });
    }
    
    // Set the admin token cookie
    await setServerAdminToken();
    
    // Also set a production-compatible admin session cookie
    const cookieStore = await cookies();
    cookieStore.set('admin-verified', 'true', {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 24, // 24 hours
      path: '/'
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin session created',
      email: user.email,
      userId: user.id
    });
  } catch (error) {
    console.error('Error setting admin session:', error);
    return NextResponse.json({ 
      error: 'Failed to create admin session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 