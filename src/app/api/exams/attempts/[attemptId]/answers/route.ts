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
    // Await params in Next.js 15
    const { attemptId } = await params;
    
    // Create Supabase client
    const supabase = createServerSupabaseClientWithCookies();
    
    // First, get the attempt to verify it exists and check ownership
    const { data: attemptData, error: attemptError } = await supabase
      .from('user_exam_attempts')
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
      .from('user_exam_answers')
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
    // Await params in Next.js 15
    const { attemptId } = await params;
    
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
      .from('user_exam_attempts')
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
    
    // Check if the answer is correct
    // The correct answer is stored in the correct_option field (a, b, c, or d)
    const correctOption = questionData.correct_option;
    const isCorrect = selectedOptions.includes(correctOption);
    
    let data, error;
    
    // Use a simpler approach: always try INSERT first, then UPDATE on conflict
    let result = await supabase
      .from('user_exam_answers')
      .insert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOptions[0],
        is_correct: isCorrect
      })
      .select()
      .single();
    
    data = result.data;
    error = result.error;
    
    // If insert fails due to duplicate key, try delete and insert instead
    if (error && error.code === '23505') {
      console.log('Duplicate key detected, attempting delete and re-insert...');
      
      // First delete the existing answer
      const deleteResult = await supabase
        .from('user_exam_answers')
        .delete()
        .eq('attempt_id', attemptId)
        .eq('question_id', questionId);
      
      if (deleteResult.error) {
        console.log('Delete failed:', deleteResult.error);
        error = deleteResult.error;
      } else {
        console.log('Delete successful, attempting re-insert...');
        
        // Now try to insert again
        const reinsertResult = await supabase
          .from('user_exam_answers')
          .insert({
            attempt_id: attemptId,
            question_id: questionId,
            selected_option: selectedOptions[0],
            is_correct: isCorrect
          })
          .select()
          .single();
        
        if (reinsertResult.data) {
          data = reinsertResult.data;
          error = null; // Clear the error since re-insert succeeded
          console.log('Re-insert successful after duplicate key error');
        } else {
          error = reinsertResult.error || error; // Keep original error if re-insert also failed
          console.log('Re-insert failed:', reinsertResult.error);
        }
      }
    }
    
    if (error) {
      console.error('Error saving/updating answer:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        attemptId,
        questionId,
        selectedOption: selectedOptions[0],
        isCorrect
      });
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