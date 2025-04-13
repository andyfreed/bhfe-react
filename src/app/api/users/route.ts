import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token || token.value !== 'temporary-token') {
      console.error('Authentication failed: Token missing or invalid');
      throw new Error('Unauthorized');
    }
    console.log('Authentication successful');
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Unauthorized');
  }
}

export async function GET() {
  try {
    await verifyAuth();
    
    const supabase = createServerSupabaseClient();
    
    // Fetch profiles first
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      );
    }
    
    // Fetch user enrollments if needed
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('user_enrollments')
      .select('*');
    
    if (enrollmentError) {
      console.error('Error fetching user enrollments:', enrollmentError);
      // Continue without enrollments data
    }
    
    // Count enrollments per user
    const enrollmentsByUser: Record<string, number> = {};
    if (enrollments) {
      enrollments.forEach((enrollment: any) => {
        const userId = enrollment.user_id;
        enrollmentsByUser[userId] = (enrollmentsByUser[userId] || 0) + 1;
      });
    }
    
    // Enhance profiles with enrollment data
    const usersWithEnrollments = profiles.map((profile: any) => ({
      ...profile,
      enrollmentCount: enrollmentsByUser[profile.id] || 0,
    }));
    
    return NextResponse.json(usersWithEnrollments);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 