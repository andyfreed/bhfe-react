import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Verify authentication and admin status
async function verifyAdminAuth(request: NextRequest) {
  // Allow everything in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  try {
    // Check cookie
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('admin_token')?.value;
    
    // Check header
    const tokenFromHeader = request.headers.get('Admin-Token');
    
    // Return true if either token matches
    return tokenFromCookie === 'temporary-token' || tokenFromHeader === 'temporary-token';
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return false;
  }
}

// GET endpoint to fetch a single enrollment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Safely resolve params which is a Promise in Next 15
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const supabase = await createServerSupabaseClient();
    
    // Verify admin access
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Safely resolve params which is a Promise in Next 15
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const supabase = await createServerSupabaseClient();
    
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

// PUT endpoint to update an enrollment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Safely resolve params which is a Promise in Next 15
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Verify admin access
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const updateData = await request.json();
    
    const supabase = await createServerSupabaseClient();
    
    // Extract the fields to update
    const {
      progress,
      completed,
      completed_at,
      enrollment_notes,
      exam_score,
      exam_passed
    } = updateData;
    
    const updates: Record<string, any> = {};
    
    // Only add defined fields
    if (progress !== undefined) updates.progress = progress;
    if (completed !== undefined) updates.completed = completed;
    if (completed_at !== undefined) updates.completed_at = completed_at;
    if (enrollment_notes !== undefined) updates.enrollment_notes = enrollment_notes;
    if (exam_score !== undefined) updates.exam_score = exam_score;
    if (exam_passed !== undefined) updates.exam_passed = exam_passed;
    
    // Add timestamp
    updates.updated_at = new Date().toISOString();
    
    // Update the record
    const result = await supabase
      .from('user_enrollments')
      .update(updates)
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

// DELETE endpoint to remove an enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Safely resolve params which is a Promise in Next 15
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const supabase = await createServerSupabaseClient();
    
    // Verify admin access
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
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