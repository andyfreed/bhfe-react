import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getExamAttemptWithAnswers, completeExamAttempt } from '@/lib/exams';
import { getUserId } from '@/lib/auth';

export const GET = async (
  req: NextRequest,
  { params }: { params: { attemptId: string } }
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
    
    const attemptId = params.attemptId;
    const attemptData = await getExamAttemptWithAnswers(attemptId);
    
    // Verify the attempt belongs to this user
    if (attemptData.attempt.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(attemptData);
  } catch (error) {
    console.error('Error getting exam attempt:', error);
    return NextResponse.json(
      { error: 'Error getting exam attempt' },
      { status: 500 }
    );
  }
};

export const POST = async (
  req: NextRequest,
  { params }: { params: { attemptId: string } }
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
    
    const attemptId = params.attemptId;
    
    // Get attempt to verify ownership
    const { attempt } = await getExamAttemptWithAnswers(attemptId);
    
    // Verify the attempt belongs to this user
    if (attempt.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Complete the attempt and calculate score
    const completedAttempt = await completeExamAttempt(attemptId);
    
    return NextResponse.json(completedAttempt);
  } catch (error) {
    console.error('Error completing exam attempt:', error);
    return NextResponse.json(
      { error: 'Error completing exam attempt' },
      { status: 500 }
    );
  }
}; 