import { NextRequest, NextResponse } from 'next/server';
import { getCourseExams, createExam } from '@/lib/exams';
import { cookies } from 'next/headers';

async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token) {
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
      { error: 'Error creating exam' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 