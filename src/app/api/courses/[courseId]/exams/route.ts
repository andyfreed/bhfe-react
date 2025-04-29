import { NextRequest, NextResponse } from 'next/server';
import { getCourseExams, createExam } from '@/lib/exams';
import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';
import { createServerSupabaseClient } from '@/lib/supabase';

// Check if user is enrolled in a course
async function isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
  try {
    if (!userId || !courseId) return false;
    
    const supabase = createServerSupabaseClient() as any;
    
    // Try using the RPC function first (more reliable)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'check_user_enrollment',
      { user_id_param: userId, course_id_param: courseId }
    );
    
    if (!rpcError && rpcResult) {
      return rpcResult.is_enrolled === true;
    }
    
    console.log('RPC enrollment check failed, falling back to direct query:', rpcError);
    
    // Fall back to direct query if RPC fails
    const { data, error } = await supabase
      .from('user_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in isUserEnrolled:', error);
    return false;
  }
}

async function verifyAuth() {
  try {
    const token = getServerAdminToken();
    
    if (!token || !isValidAdminToken(token)) {
      console.error('Authentication failed: Admin token missing');
      throw new Error('Unauthorized');
    }
    console.log('Admin authentication successful');
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Unauthorized');
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } | Promise<{ courseId: string }> }
) {
  try {
    // Await the params if it's a Promise
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const courseId = resolvedParams.courseId;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    // Check if this is a student trying to access exams for their enrolled course
    const supabase = createServerSupabaseClient() as any;
    const { data: { session } } = await supabase.auth.getSession();
    
    // If the user is logged in, check if they're enrolled in this course
    let isEnrolled = false;
    if (session && session.user) {
      console.log(`Checking if user ${session.user.id} is enrolled in course ${courseId} for exams access`);
      isEnrolled = await isUserEnrolled(session.user.id as string, courseId);
      if (isEnrolled) {
        console.log(`User ${session.user.id} is enrolled in course ${courseId}, allowing exams access`);
      } else {
        console.log(`User is authenticated but not enrolled in this course for exams`);
      }
    }
    
    // If the user is not enrolled, verify admin access
    if (!isEnrolled) {
      try {
        await verifyAuth();
      } catch (error) {
        // Check if the user is trying to access via the admin panel or directly
        const referer = req.headers.get('referer') || '';
        const isAdminAccess = referer.includes('/admin/');
        
        if (isAdminAccess) {
          return NextResponse.json(
            { error: 'Admin authentication required' },
            { status: 401 }
          );
        } else {
          // For non-admin access, return 403 with clear message
          return NextResponse.json(
            { error: 'You are not enrolled in this course' },
            { status: 403 }
          );
        }
      }
    }
    
    const exams = await getCourseExams(courseId);
    
    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching course exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course exams' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } | Promise<{ courseId: string }> }
) {
  try {
    // Check admin access
    await verifyAuth();
    
    // Await the params if it's a Promise
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const courseId = resolvedParams.courseId;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    const { title, description, passing_score, attempt_limit, questions } = body;
    
    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Exam title is required' },
        { status: 400 }
      );
    }
    
    // Validate attempt_limit (must be a positive number or null)
    if (attempt_limit !== null && attempt_limit !== undefined && 
        (isNaN(Number(attempt_limit)) || Number(attempt_limit) < 1)) {
      return NextResponse.json(
        { error: 'Attempt limit must be a positive number or left empty for unlimited attempts' },
        { status: 400 }
      );
    }
    
    const examData = {
      course_id: courseId,
      title,
      description,
      passing_score: parseInt(passing_score, 10),
      attempt_limit: attempt_limit === null ? null : parseInt(attempt_limit, 10)
    };
    
    const result = await createExam(examData, questions);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Error creating exam', details: error.message },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 