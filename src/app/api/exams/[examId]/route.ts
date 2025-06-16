import { NextRequest, NextResponse } from 'next/server';
import { getExamWithQuestions, updateExam, deleteExam } from '@/lib/exams';
import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';

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
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    // Await the params which is a Promise in Next.js 15
    const resolvedParams = await params;
    const examId = resolvedParams.examId;
    
    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }
    
    const exam = await getExamWithQuestions(examId);
    
    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(exam);
  } catch (error: any) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    await verifyAuth();
    
    // Await the params which is a Promise in Next.js 15
    const resolvedParams = await params;
    const examId = resolvedParams.examId;
    
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
      title,
      description,
      passing_score: parseInt(passing_score, 10),
      attempt_limit: attempt_limit === null ? null : parseInt(attempt_limit, 10)
    };
    
    const result = await updateExam(examId, examData, questions);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { error: 'Error updating exam', details: error.message },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    await verifyAuth();
    
    // Await the params which is a Promise in Next.js 15
    const resolvedParams = await params;
    const examId = resolvedParams.examId;
    
    await deleteExam(examId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { error: 'Error deleting exam' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 