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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    await verifyAuth();
    
    const id = params.id;
    
    // Get Supabase client
    const supabase = createServerSupabaseClient();
    
    // Fetch the inquiry by ID
    const { data, error } = await supabase
      .from('contact_inquiries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching inquiry ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch inquiry' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Error in GET /api/admin/inquiries/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiry' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    await verifyAuth();
    
    const id = params.id;
    
    // Parse the request body
    const data = await request.json();
    
    // Get Supabase client
    const supabase = createServerSupabaseClient();
    
    // Update the inquiry by ID
    const { data: updatedInquiry, error } = await supabase
      .from('contact_inquiries')
      .update({
        status: data.status,
        notes: data.notes,
        responded_at: data.responded_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating inquiry ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to update inquiry' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedInquiry);
    
  } catch (error: any) {
    console.error('Error in PUT /api/admin/inquiries/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update inquiry' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    await verifyAuth();
    
    const id = params.id;
    
    // Get Supabase client
    const supabase = createServerSupabaseClient();
    
    // Delete the inquiry by ID
    const { error } = await supabase
      .from('contact_inquiries')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting inquiry ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to delete inquiry' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/inquiries/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete inquiry' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 