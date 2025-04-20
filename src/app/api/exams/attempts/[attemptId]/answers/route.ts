import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/adminAuth';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/exams/attempts/[attemptId]/answers
 * Save a user's answer for a specific question in an attempt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const attemptId = params.attemptId;
    if (!attemptId) {
      return NextResponse.json(
        { error: 'Missing attemptId parameter' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { questionId, selectedOption } = body;

    if (!questionId || !selectedOption) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for admin access first
    const adminUserId = await checkAdminAccess();
    
    if (adminUserId && attemptId === 'mock-attempt-id') {
      console.log('Admin access verified - saving mock answer');
      
      // Return a mock answer
      return NextResponse.json({
        id: 'mock-answer-id',
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: true,
        created_at: new Date().toISOString()
      });
    }
    
    // For regular users, save the real answer
    const supabase = createServerSupabaseClient();
    
    // Get user from auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      console.log('No valid session found - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // First, get the attempt to verify ownership
    const { data: attemptData, error: attemptError } = await supabase
      .from('user_exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
    
    if (attemptError || !attemptData) {
      console.error('Error fetching attempt:', attemptError);
      return NextResponse.json({ error: 'Failed to verify attempt' }, { status: 500 });
    }
    
    // Verify the attempt belongs to the user
    if (attemptData.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get question data to determine if answer is correct
    const { data: questionData, error: questionError } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('id', questionId)
      .single();
    
    if (questionError || !questionData) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json({ error: 'Failed to verify question' }, { status: 500 });
    }
    
    // Check if selected option is correct
    const isCorrect = selectedOption === questionData.correct_option;
    
    // Upsert the answer (update if exists, insert if not)
    const { data, error } = await supabase
      .from('user_exam_answers')
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: isCorrect
      }, {
        onConflict: 'attempt_id,question_id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving answer:', error);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 