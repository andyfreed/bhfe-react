import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Interface for enrollment creation
interface CreateEnrollmentData {
  user_id: string;
  course_id: string;
  progress?: number;
  completed?: boolean;
  completed_at?: string | null;
  enrollment_notes?: string;
}

// Validate enrollment data
function validateEnrollmentData(data: any): boolean {
  if (!data.user_id || !data.course_id) {
    return false;
  }
  
  if (data.progress !== undefined && (data.progress < 0 || data.progress > 100)) {
    return false;
  }
  
  return true;
}

// GET endpoint to fetch all enrollments (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    const supabase = createServerSupabaseClient();
    
    // Note: We're bypassing auth checks for now since we're using client-side localStorage auth
    
    let query = supabase
      .from('user_enrollments')
      .select(`
        *,
        user:user_id (id, email),
        course:course_id (id, title, main_subject, description)
      `, { count: 'exact' })
      .order('enrolled_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Database error fetching enrollments:', error);
      return NextResponse.json({
        error: 'Failed to fetch enrollments: ' + error.message,
        details: error,
        enrollments: [],
        pagination: { page, limit, total: 0, pages: 0 }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      enrollments: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      }
    });
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch enrollments',
      enrollments: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    }, { status: 500 });
  }
}

// POST endpoint to create a new enrollment
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Note: We're bypassing auth checks for now since we're using client-side localStorage auth
    
    const body = await request.json();
    
    // Check if we're enrolling a single user or multiple users
    if (Array.isArray(body)) {
      // Batch enrollment
      const enrollmentData = body.map(enrollment => {
        if (!validateEnrollmentData(enrollment)) {
          throw new Error('Invalid enrollment data in batch');
        }
        
        return {
          user_id: enrollment.user_id,
          course_id: enrollment.course_id,
          progress: enrollment.progress || 0,
          completed: enrollment.completed || false,
          completed_at: enrollment.completed ? new Date().toISOString() : null,
          enrollment_notes: enrollment.enrollment_notes || '',
          enrolled_at: new Date().toISOString(),
        };
      });
      
      const { data, error } = await supabase
        .from('user_enrollments')
        .insert(enrollmentData)
        .select();
      
      if (error) {
        throw error;
      }
      
      return NextResponse.json(data);
    } else {
      // Single enrollment
      if (!validateEnrollmentData(body)) {
        return NextResponse.json(
          { error: 'Invalid enrollment data' },
          { status: 400 }
        );
      }
      
      const enrollmentData = {
        user_id: body.user_id,
        course_id: body.course_id,
        progress: body.progress || 0,
        completed: body.completed || false,
        completed_at: body.completed ? new Date().toISOString() : null,
        enrollment_notes: body.enrollment_notes || '',
        enrolled_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('user_enrollments')
        .insert(enrollmentData)
        .select();
      
      if (error) {
        throw error;
      }
      
      return NextResponse.json(data[0]);
    }
  } catch (error: any) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create enrollment' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove enrollments
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const enrollmentId = searchParams.get('id');
    
    if (!enrollmentId && (!userId || !courseId)) {
      return NextResponse.json(
        { error: 'Must provide either enrollment ID or both user_id and course_id' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    // Note: We're bypassing auth checks for now since we're using client-side localStorage auth
    
    if (enrollmentId) {
      // Delete by enrollment ID
      const { error } = await supabase
        .from('user_enrollments')
        .delete()
        .eq('id', enrollmentId);
      
      if (error) {
        throw error;
      }
    } else {
      // Delete by user_id and course_id
      const { error } = await supabase
        .from('user_enrollments')
        .delete()
        .eq('user_id', userId!)
        .eq('course_id', courseId!);
      
      if (error) {
        throw error;
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
} 