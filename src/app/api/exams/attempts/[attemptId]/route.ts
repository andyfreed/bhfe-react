import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/adminAuth';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/exams/attempts/[attemptId]
 * Get a specific exam attempt with its answers
 */
export async function GET(
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

    // Check for admin access first
    const adminUserId = await checkAdminAccess();
    
    if (adminUserId && attemptId === 'mock-attempt-id') {
      console.log('Admin access verified - returning mock attempt data');
      
      // Return mock attempt data
      return NextResponse.json({
        attempt: {
          id: 'mock-attempt-id',
          user_id: adminUserId,
          exam_id: 'mock-exam-id',
          score: null,
          completed: false,
          started_at: new Date().toISOString(),
          completed_at: null,
          passed: null,
          created_at: new Date().toISOString()
        },
        answers: []  // No answers yet for the mock attempt
      });
    }
    
    // For regular users, fetch real attempt data
    const supabase = createServerSupabaseClient();
    
    // Get user from auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      console.log('No valid session found - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('user_exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
    
    if (attemptError) {
      console.error('Error fetching attempt:', attemptError);
      return NextResponse.json({ error: 'Failed to fetch exam attempt' }, { status: 500 });
    }
    
    // Verify the attempt belongs to the user
    if (attempt.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get answers for this attempt
    const { data: answers, error: answersError } = await supabase
      .from('user_exam_answers')
      .select('*')
      .eq('attempt_id', attemptId);
    
    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }
    
    return NextResponse.json({
      attempt,
      answers: answers || []
    });
  } catch (error) {
    console.error('Error in GET attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/exams/attempts/[attemptId]
 * Submit (complete) an exam attempt
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

    // Check for admin access first
    const adminUserId = await checkAdminAccess();
    
    if (adminUserId && attemptId === 'mock-attempt-id') {
      console.log('Admin access verified - returning completed mock attempt');
      
      // Return mock completed attempt
      return NextResponse.json({
        id: 'mock-attempt-id',
        user_id: adminUserId,
        exam_id: 'mock-exam-id',
        score: 80, // Mock score
        completed: true,
        started_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
        completed_at: new Date().toISOString(),
        passed: true,
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      });
    }
    
    // For regular users, process the real attempt
    const supabase = createServerSupabaseClient();
    
    // Get user from auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      console.log('No valid session found - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('user_exam_attempts')
      .select('*, exam:exams(*)')
      .eq('id', attemptId)
      .single();
    
    if (attemptError) {
      console.error('Error fetching attempt:', attemptError);
      return NextResponse.json({ error: 'Failed to fetch exam attempt' }, { status: 500 });
    }
    
    // Verify the attempt belongs to the user
    if (attempt.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get answers and questions for this attempt
    const { data: answers, error: answersError } = await supabase
      .from('user_exam_answers')
      .select('*, question:exam_questions(*)')
      .eq('attempt_id', attemptId);
    
    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }
    
    // Calculate score
    const totalQuestions = attempt.exam.num_questions;
    const answeredQuestions = answers ? answers.length : 0;
    const correctAnswers = answers ? answers.filter(a => a.is_correct).length : 0;
    
    const score = totalQuestions > 0 
      ? Math.round((correctAnswers / totalQuestions) * 100) 
      : 0;
    
    const passed = score >= attempt.exam.passing_score;
    
    // Update the attempt
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('user_exam_attempts')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        score,
        passed
      })
      .eq('id', attemptId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return NextResponse.json({ error: 'Failed to update exam attempt' }, { status: 500 });
    }
    
    return NextResponse.json(updatedAttempt);
  } catch (error) {
    console.error('Error in POST attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 