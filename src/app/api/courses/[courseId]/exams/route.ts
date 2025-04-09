import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getCourseExams, createExam } from '@/lib/exams';
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
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    const exams = await getCourseExams(courseId);
    
    return NextResponse.json(exams);
  } catch (error: any) {
    console.error('Error getting course exams:', error);
    return NextResponse.json(
      { error: 'Error getting course exams' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Check admin access
    await verifyAuth();
    
    const courseId = params.courseId;
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    const { title, description, passing_score, questions } = body;
    
    const examData = {
      course_id: courseId,
      title,
      description,
      passing_score: parseInt(passing_score, 10)
    };
    
    const result = await createExam(examData, questions);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Error creating exam' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 