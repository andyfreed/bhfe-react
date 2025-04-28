import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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
    return token === 'temporary-token';
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return false;
  }
}

// GET endpoint to fetch a single enrollment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    
    const supabase = createServerSupabaseClient();
    
    // Note: We're bypassing auth checks for now since we're using client-side localStorage auth
    
    const { data, error } = await supabase
      .from('user_enrollments')
      .select(`
        *,
        course:courses(id, title, main_subject, description)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update an enrollment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    
    const supabase = createServerSupabaseClient();
    
    // Note: We're bypassing auth checks for now since we're using client-side localStorage auth
    
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (body.progress !== undefined && (body.progress < 0 || body.progress > 100)) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Prepare the update data
    const updateData: Record<string, any> = {};
    
    if (body.progress !== undefined) {
      updateData.progress = body.progress;
    }
    
    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      
      // If marking as completed and progress is not 100%, set it to 100%
      if (body.completed && body.progress !== undefined && body.progress < 100) {
        updateData.progress = 100;
      }
      
      // Set or clear completed_at timestamp
      if (body.completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }
    
    if (body.enrollment_notes !== undefined) {
      updateData.enrollment_notes = body.enrollment_notes;
    }
    
    // Update the enrollment
    const result = await supabase
      .from('user_enrollments')
      .update(updateData)
      .eq('id', id);
      
    // Now fetch the updated record
    if (!result.error) {
      const { data: updatedEnrollment, error: fetchError } = await supabase
        .from('user_enrollments')
        .select(`
          *,
          user:user_id (id, email),
          course:course_id (id, title, main_subject, description)
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) {
        return NextResponse.json(
          { error: fetchError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json(updatedEnrollment);
    } else {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Define the PUT handler for updating enrollments
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    
    // Verify admin access
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Get update data from request
    const updateData = await request.json();
    
    // Create Supabase client
    const supabase = createServerSupabaseClient();
    
    // Update the enrollment
    const updateResult = await supabase
      .from('user_enrollments')
      .update({
        progress: updateData.progress,
        completed: updateData.completed,
        completed_at: updateData.completed_at,
        enrollment_notes: updateData.enrollment_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (updateResult.error) {
      return NextResponse.json(
        { error: `Failed to update enrollment: ${updateResult.error.message}` }, 
        { status: 500 }
      );
    }
    
    // Fetch the updated record
    const { data, error: fetchError } = await supabase
      .from('user_enrollments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch updated enrollment: ${fetchError.message}` }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: `Internal server error: ${(error as Error).message}` }, 
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove an enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Safely resolve params which can be a Promise in Next 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    
    const supabase = createServerSupabaseClient();
    
    // Note: We're bypassing auth checks for now since we're using client-side localStorage auth
    
    // Delete the enrollment
    const { error: deleteError } = await supabase
      .from('user_enrollments')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 