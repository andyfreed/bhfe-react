import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET endpoint to fetch a single enrollment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Note: We're bypassing auth checks for now since we're using client-side localStorage auth

    // Fetch the enrollment with user and course details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_enrollments')
      .select(`
        *,
        user:user_id (id, email),
        course:course_id (id, title, main_subject, description)
      `)
      .eq('id', params.id)
      .single();
    
    if (enrollmentError) {
      return NextResponse.json(
        { error: enrollmentError.message },
        { status: enrollmentError.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    return NextResponse.json(enrollment);
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
  { params }: { params: { id: string } }
) {
  try {
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
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('user_enrollments')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        user:user_id (id, email),
        course:course_id (id, title, main_subject, description)
      `)
      .single();
    
    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedEnrollment);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove an enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Note: We're bypassing auth checks for now since we're using client-side localStorage auth
    
    // Delete the enrollment
    const { error: deleteError } = await supabase
      .from('user_enrollments')
      .delete()
      .eq('id', params.id);
    
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