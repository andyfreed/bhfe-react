import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies
    const allCookies = cookieStore.getAll();
    const cookieInfo = allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }));
    
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    let profile = null;
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      profile = profileData;
    }
    
    return NextResponse.json({
      cookies: cookieInfo,
      session: session ? {
        user_id: session.user?.id,
        email: session.user?.email,
        expires_at: session.expires_at
      } : null,
      sessionError: sessionError?.message,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : null,
      userError: userError?.message,
      profile: profile,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 