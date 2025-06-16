import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { isUserAdmin } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Create a new supabase server client
    const supabase = await createServerSupabaseClient();
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    // Get the session using the client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log('Server session check:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionError,
      timestamp: new Date().toISOString()
    });

    if (sessionError || !session) {
      // Try to get user from cookie
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        
        // User found via cookie, continue with this
        console.log('Found user via auth.getUser():', user.email);
        
        // Check if user is admin
        const isAdmin = user.email ? await isUserAdmin(user.email) : false;
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 });
        }
        
        return NextResponse.json({
          data: {
            ...profile,
            role: isAdmin ? 'admin' : 'user'
          },
          userId: user.id
        });
      } catch (error) {
        console.error('Error getting user:', error);
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
    }

    // Check if user is admin
    const isAdmin = session.user.email ? await isUserAdmin(session.user.email) : false;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')  // Select all fields to see what we have
      .eq('id', session.user.id)
      .single();

    console.log('Profile check:', { 
      hasProfile: !!profile,
      isAdmin,
      profileData: profile,
      profileError 
    });

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 });
    }

    // Return profile data with admin status
    return NextResponse.json({ 
      data: {
        ...profile,
        role: isAdmin ? 'admin' : 'user'
      },
      userId: session.user.id
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 