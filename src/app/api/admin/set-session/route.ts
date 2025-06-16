import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/auth';
import { setServerAdminToken } from '@/lib/serverCookies';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get the current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || !user.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if user is admin
    const isAdmin = await isUserAdmin(user.email);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Set the admin token cookie
    await setServerAdminToken();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin session created',
      email: user.email 
    });
  } catch (error) {
    console.error('Error setting admin session:', error);
    return NextResponse.json({ 
      error: 'Failed to create admin session' 
    }, { status: 500 });
  }
} 