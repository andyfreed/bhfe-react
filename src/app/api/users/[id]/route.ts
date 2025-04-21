import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';

// Verify authentication and admin status
async function verifyAdminAuth() {
  try {
    const adminToken = await getServerAdminToken();
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;

    const supabase = createAdminSupabase();
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError) {
      return NextResponse.json({ error: `Failed to fetch user: ${userError.message}` }, { status: 500 });
    }
    if (!userData.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const user = {
      id: userData.user.id,
      email: userData.user.email,
      created_at: userData.user.created_at,
      last_sign_in_at: userData.user.last_sign_in_at,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: userId } = await params;
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id: userId } = await params;
    const supabase = createAdminSupabase();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: `Failed to delete user: ${error.message}` }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/users/[id]:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
} 