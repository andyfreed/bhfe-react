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
    // Verify admin authentication
    await verifyAuth();
    
    // Get Supabase client
    const supabase = createServerSupabaseClient();
    
    // Fetch all inquiries, ordered by most recent first
    const { data, error } = await supabase
      .from('contact_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching inquiries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inquiries' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Error in GET /api/admin/inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 