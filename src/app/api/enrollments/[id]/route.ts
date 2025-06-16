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

// GET: Retrieve an enrollment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify the user is authenticated as an admin
    await verifyAuth();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }
    
    // Create a server-side Supabase client (with service role key)
    const supabase = createServerSupabaseClient();
    
    // Fetch the enrollment with user and course details
    const { data, error } = await supabase
      .from('user_enrollments')
      .select('*, user:users(*), course:courses(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching enrollment:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch enrollment' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }
    
    // Return the enrollment data
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unexpected error in GET /api/enrollments/[id]:', error);
    
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

// PUT: Update an enrollment by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify the user is authenticated as an admin
    await verifyAuth();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }
    
    // Get the update data from the request
    const updateData = await request.json();
    
    // Create a server-side Supabase client (with service role key)
    const supabase = createServerSupabaseClient();
    
    // Prepare the update object
    const updateObject: {
      progress?: number;
      completed?: boolean;
      completed_at?: string | null;
      enrollment_notes?: string | null;
      exam_score?: number | null;
      exam_passed?: boolean | null;
      updated_at: string;
      [key: string]: any; // Index signature to allow dynamic property access
    } = {
      progress: updateData.progress !== undefined ? updateData.progress : undefined,
      completed: updateData.completed !== undefined ? updateData.completed : undefined,
      enrollment_notes: updateData.enrollment_notes !== undefined ? updateData.enrollment_notes : undefined,
      exam_score: updateData.exam_score !== undefined ? updateData.exam_score : undefined,
      exam_passed: updateData.exam_passed !== undefined ? updateData.exam_passed : undefined,
      updated_at: new Date().toISOString()
    };
    
    // Add completed_at if completed is true
    if (updateData.completed === true) {
      updateObject.completed_at = new Date().toISOString();
    } else if (updateData.completed === false) {
      updateObject.completed_at = null;
    }

    // Remove any undefined values from the update object
    Object.keys(updateObject).forEach(key => {
      if (updateObject[key] === undefined) {
        delete updateObject[key];
      }
    });
    
    // Update the enrollment
    const { error } = await supabase
      .from('user_enrollments')
      .update(updateObject)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating enrollment:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update enrollment' },
        { status: 500 }
      );
    }
    
    // Fetch the updated enrollment with user and course details
    const { data: updatedData, error: fetchError } = await supabase
      .from('user_enrollments')
      .select('*, user:users(*), course:courses(*)')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching updated enrollment:', fetchError);
      return NextResponse.json(
        { error: fetchError.message || 'Failed to fetch updated enrollment' },
        { status: 500 }
      );
    }
    
    // Return the updated enrollment data
    return NextResponse.json(updatedData);
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/enrollments/[id]:', error);
    
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

// DELETE: Remove an enrollment by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify the user is authenticated as an admin
    await verifyAuth();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }
    
    // Create a server-side Supabase client (with service role key)
    const supabase = createServerSupabaseClient();
    
    // Delete the enrollment
    const { error } = await supabase
      .from('user_enrollments')
      .delete()
      .eq('id', id);
    
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