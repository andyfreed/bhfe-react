import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log('Session check:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      sessionError 
    });

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')  // Select all fields to see what we have
      .eq('id', session.user.id)
      .single();

    console.log('Profile check:', { 
      hasProfile: !!profile,
      profileData: profile,
      profileError 
    });

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 });
    }

    // Return more profile data for debugging
    return NextResponse.json({ 
      data: profile,
      userId: session.user.id
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 