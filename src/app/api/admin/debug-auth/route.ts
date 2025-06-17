import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminVerified = cookieStore.get('admin-verified');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration',
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // If we have a user, check their profile
    let profile = null;
    if (user) {
      const adminSupabase = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );
      
      const { data: profileData } = await adminSupabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
      
      profile = profileData;
    }
    
    return NextResponse.json({
      authentication: {
        hasAdminVerifiedCookie: !!adminVerified,
        cookieValue: adminVerified?.value,
        hasSupabaseSession: !!session,
        hasSupabaseUser: !!user,
        userEmail: user?.email,
        userRole: profile?.role,
        isAdmin: profile?.role === 'admin'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      recommendation: !session 
        ? 'You need to log in first at /admin/login' 
        : profile?.role !== 'admin' 
          ? 'Your user does not have admin role in the profiles table'
          : !adminVerified
            ? 'Missing admin-verified cookie. Try logging in again at /admin/login'
            : 'Everything looks good!'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug check failed',
      message: error.message
    });
  }
} 