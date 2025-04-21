import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClientWithCookies } from '@/lib/supabaseServer';

// Fixed development user ID for bypassing auth in development mode
const DEV_USER_ID = '9e5d47c8-e363-4444-a55e-97f1f0420633';
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * GET /api/exams/attempts/[attemptId]/answers
 * Get all answers for a specific exam attempt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    // Get the attempt ID from params
    const { attemptId } = params;
    
    // Create Supabase client
    const supabase = createServerSupabaseClientWithCookies();
    
    // First, get the attempt to verify it exists and check ownership
    const { data: attemptData, error: attemptError } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
    
    if (attemptError || !attemptData) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }
    
    // Skip auth check in development mode
    if (!IS_DEV) {
      // Get user from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Verify user owns this attempt
      if (attemptData.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - you do not own this attempt' },
          { status: 403 }
        );
      }
    }
    
    // Get all answers for this attempt
    const { data, error } = await supabase
      .from('exam_answers')
      .select('*')
      .eq('attempt_id', attemptId);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/exams/attempts/[attemptId]/answers:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exams/attempts/[attemptId]/answers
 * Save a user's answer for a specific question in an attempt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    // Get the attempt ID from params
    const { attemptId } = params;
    
    // Parse the request body
    const body = await request.json();
    const { questionId, selectedOptions } = body;
    
    if (!questionId || !selectedOptions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = createServerSupabaseClientWithCookies();
    
    // First, get the attempt to verify ownership
    const { data: attemptData, error: attemptError } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
    
    if (attemptError || !attemptData) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }
    
    // Skip auth check in development mode
    if (!IS_DEV) {
      // Get user from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Verify user owns this attempt
      if (attemptData.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - you do not own this attempt' },
          { status: 403 }
        );
      }
    }
    
    // Get the question to check if the answer is correct
    const { data: questionData, error: questionError } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('id', questionId)
      .single();
    
    if (questionError || !questionData) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Check if the selected options match the correct answer
    // This is a simple example - in a real app, you'd have more complex logic
    const correctAnswer = questionData.correct_answer;
    const isCorrect = JSON.stringify(selectedOptions.sort()) === JSON.stringify(correctAnswer.sort());
    
    // Save the answer
    const { data, error } = await supabase
      .from('exam_answers')
      .insert([
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_options: selectedOptions,
          is_correct: isCorrect
        }
      ])
      .select()
      .single();
    
    if (error) {
      // Check if it's a duplicate answer
      if (error.code === '23505') { // PostgreSQL unique violation code
        // Update the existing answer
        const { data: updatedData, error: updateError } = await supabase
          .from('exam_answers')
          .update({
            selected_options: selectedOptions,
            is_correct: isCorrect
          })
          .eq('attempt_id', attemptId)
          .eq('question_id', questionId)
          .select()
          .single();
        
        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update answer' },
            { status: 500 }
          );
        }
        
        return NextResponse.json(updatedData);
      }
      
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/exams/attempts/[attemptId]/answers:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 