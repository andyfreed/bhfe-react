import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createExamAttempt, getUserExamAttempts } from '@/lib/exams';
import { getUserId } from '@/lib/auth';

export const GET = async (
  req: NextRequest,
  { params }: { params: { examId: string } }
) => {
  try {
    const supabase = await createServerSupabaseClient();
    const userId = await getUserId(supabase);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const examId = params.examId;
    const attempts = await getUserExamAttempts(userId, examId);
    
    return NextResponse.json(attempts);
  } catch (error) {
    console.error('Error getting user exam attempts:', error);
    return NextResponse.json(
      { error: 'Error getting user exam attempts' },
      { status: 500 }
    );
  }
};

export const POST = async (
  req: NextRequest,
  { params }: { params: { examId: string } }
) => {
  try {
    const supabase = await createServerSupabaseClient();
    const userId = await getUserId(supabase);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const examId = params.examId;
    const attempt = await createExamAttempt(userId, examId);
    
    return NextResponse.json(attempt);
  } catch (error) {
    console.error('Error creating exam attempt:', error);
    return NextResponse.json(
      { error: 'Error creating exam attempt' },
      { status: 500 }
    );
  }
}; 