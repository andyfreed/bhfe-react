import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Verify the user is authenticated as an admin
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

// DELETE: Remove an enrollment by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the user is authenticated as an admin
    await verifyAuth();
    
    const enrollmentId = params.id;
    
    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }
    
    // Create a server-side Supabase client (with service role key)
    const supabase = createServerSupabaseClient();
    
    // Delete the enrollment
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId);
    
    if (error) {
      console.error('Error deleting enrollment:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete enrollment' },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/enrollments/[id]:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 