import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClientWithCookies } from '@/lib/supabaseServer';

// Fixed development user ID for bypassing auth in development mode
const DEV_USER_ID = '9e5d47c8-e363-4444-a55e-97f1f0420633';
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * GET /api/exams/attempts/[attemptId]
 * Get a specific exam attempt with its answers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { attemptId } = await params;
    
    // Create Supabase client
    const supabase = createServerSupabaseClientWithCookies();
    
    // Get the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('user_exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
    
    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }
    
    // Skip auth check in development mode
    if (!IS_DEV) {
      // Get user from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.id !== attempt.user_id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(attempt);
  } catch (error) {
    console.error('Error in GET /api/exams/attempts/[attemptId]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exams/attempts/[attemptId]
 * Submit (complete) an exam attempt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { attemptId } = await params;
    
    // Parse the request body
    const body = await request.json();
    const { status, score, passed } = body;
    
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
    
    // Update the attempt
    const updateData: any = {};
    
    // Convert status to completed boolean
    if (status === 'completed') {
      updateData.completed = true;
      updateData.completed_at = new Date().toISOString();
      
      // Calculate score if not provided
      if (score === undefined) {
        // Get all answers for this attempt
        const { data: answers, error: answersError } = await supabase
          .from('user_exam_answers')
          .select('is_correct')
          .eq('attempt_id', attemptId);
        
        // Get total number of questions in the exam
        const { data: examQuestions, error: questionsError } = await supabase
          .from('exam_questions')
          .select('id')
          .eq('exam_id', attemptData.exam_id);
        
        if (!answersError && answers && !questionsError && examQuestions) {
          const correctAnswers = answers.filter(a => a.is_correct).length;
          const totalQuestions = examQuestions.length;
          const answeredQuestions = answers.length;
          
          console.log(`Debug: Total questions: ${totalQuestions}, Answered questions: ${answeredQuestions}, Correct answers: ${correctAnswers}`);
          
          if (totalQuestions > 0) {
            // Only calculate score if all questions have been answered
            if (answeredQuestions === totalQuestions) {
              const calculatedScore = Math.round((correctAnswers / totalQuestions) * 100);
              updateData.score = calculatedScore;
              
              // Get exam to check passing score
              const { data: examData, error: examError } = await supabase
                .from('exams')
                .select('passing_score')
                .eq('id', attemptData.exam_id)
                .single();
              
              if (!examError && examData) {
                updateData.passed = calculatedScore >= examData.passing_score;
                console.log(`Score: ${calculatedScore}, Passing score: ${examData.passing_score}, Passed: ${updateData.passed}`);
              }
            } else {
              console.log(`Warning: Not all questions answered (${answeredQuestions}/${totalQuestions}). Cannot calculate final score yet.`);
              // Set a temporary score based on what's been answered so far, but don't mark as passed
              const tempScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
              updateData.score = tempScore;
              updateData.passed = false; // Don't pass until all questions are answered
            }
          }
        }
      }
    } else if (status === 'in_progress') {
      updateData.completed = false;
    }
    
    if (score !== undefined) updateData.score = score;
    if (passed !== undefined) updateData.passed = passed;
    
    const { data, error } = await supabase
      .from('user_exam_attempts')
      .update(updateData)
      .eq('id', attemptId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating attempt:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        updateData
      });
      return NextResponse.json(
        { error: 'Failed to update attempt' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/exams/attempts/[attemptId]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    // Await params in Next.js 15
    const { attemptId } = await params;
    
    // Create Supabase client
    const supabase = createServerSupabaseClientWithCookies();
    
    // Get the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('user_exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
    
    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }
    
    // Skip auth check in development mode
    if (!IS_DEV) {
      // Get user from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.id !== attempt.user_id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    // Get the update data from the request
    const updateData = await request.json();
    
    // Update the attempt
    const { data, error } = await supabase
      .from('user_exam_attempts')
      .update(updateData)
      .eq('id', attemptId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update attempt' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/exams/attempts/[attemptId]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 