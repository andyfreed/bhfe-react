import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    let profile = null;
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
      profile = profileData;
    }
    const cookieStore = await cookies();
    const adminVerified = cookieStore.get('admin-verified');
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