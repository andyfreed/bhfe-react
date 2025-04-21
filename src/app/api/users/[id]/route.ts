import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';
import { cookies } from 'next/headers';

// Verify authentication and admin status
async function verifyAdminAuth() {
  // Allow everything in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    return isValidAdminToken(token);
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return false;
  }
}

// utility to init supabase
function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Server configuration error');
  }
  return createClient(supabaseUrl, supabaseKey);
}

// GET user
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;

    const supabase = createAdminSupabase();
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    let authUser = userData.user;

    // If auth lookup failed with "User not found", fall back to public.users table
    if (userError || !authUser) {
      const { data: fallbackUser, error: fallbackError } = await supabase
        .from('users')
        .select('id, email, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (fallbackError || !fallbackUser) {
        const msg = userError?.message || fallbackError?.message || '';
        const statusCode = (userError && userError.message?.toLowerCase().includes('not found')) || fallbackError?.code === 'PGRST116'
          ? 404
          : 500;
        return NextResponse.json(
          { error: statusCode === 404 ? 'User not found' : `Failed to fetch user: ${msg}` },
          { status: statusCode }
        );
      }

      authUser = {
        id: fallbackUser.id,
        email: fallbackUser.email,
        created_at: fallbackUser.created_at,
        last_sign_in_at: fallbackUser.updated_at,
      } as any; // minimal shape needed below
    }

    // At this point authUser is guaranteed
    if (!authUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const user = {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at,
      role: profileData?.role || 'user',
      full_name: profileData?.full_name || '',
      company: profileData?.company || '',
      phone: profileData?.phone || '',
    };
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error in GET /api/users/[id]:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;
    const body = await request.json();
    const { email, full_name, company, phone, role } = body;

    const supabase = createAdminSupabase();
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !existingUser.user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (email && email !== existingUser.user.email) {
      const { error } = await supabase.auth.admin.updateUserById(userId, { email });
      if (error) return NextResponse.json({ error: `Failed to update email: ${error.message}` }, { status: 500 });
    }

    const profileData = { id: userId, full_name, company, phone, role, updated_at: new Date().toISOString() };
    const { error: profileError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
    if (profileError) return NextResponse.json({ error: `Failed to update profile: ${profileError.message}` }, { status: 500 });

    return NextResponse.json({ ...profileData, email });
  } catch (error: any) {
    console.error('Error in PUT /api/users/[id]:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;
    const supabase = createAdminSupabase();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: `Failed to delete user: ${error.message}` }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/users/[id]:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
} 