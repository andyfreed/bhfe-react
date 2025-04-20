import { NextRequest, NextResponse } from 'next/server';
import { getServerCookie, isValidAdminToken } from '@/lib/serverCookies';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/exams/[examId]/attempts
 * Get all attempts for the exam by the current user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  const examId = params.examId;
  
  if (!examId) {
    return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
  }

  try {
    // Check for admin token
    const adminToken = getServerCookie('admin_token');
    console.log('Admin token check:', adminToken);
    
    if (adminToken && isValidAdminToken(adminToken)) {
      console.log('Valid admin token found - returning mock attempts');
      // Return an empty array of attempts for now to allow creating a new one
      return NextResponse.json([]);
    }
    
    // For regular users, fetch real attempts from the database
    // Create Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get user from auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      console.log('No valid session found - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('User ID:', userId);
    
    // Get attempts for this user and exam
    const { data: attempts, error } = await supabase
      .from('user_exam_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('exam_id', examId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching attempts:', error);
      return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
    }
    
    return NextResponse.json(attempts || []);
  } catch (error) {
    console.error('Error in GET attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/exams/[examId]/attempts
 * Create a new attempt for the exam by the current user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  const examId = params.examId;
  
  if (!examId) {
    return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
  }

  try {
    // Check for admin token
    const adminToken = getServerCookie('admin_token');
    console.log('Admin token check for POST:', adminToken);
    
    if (adminToken && isValidAdminToken(adminToken)) {
      console.log('Valid admin token found - creating mock attempt');
      
      // Return a mock attempt 
      return NextResponse.json({
        id: 'mock-attempt-id',
        user_id: 'admin-user-id',
        exam_id: examId,
        score: null,
        completed: false,
        started_at: new Date().toISOString(),
        completed_at: null,
        passed: null,
        created_at: new Date().toISOString()
      });
    }
    
    // For regular users, create a real attempt in the database
    // Create Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get user from auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      console.log('No valid session found - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Creating attempt for user ID:', userId);
    
    // First, get the exam to check if there's an attempt limit
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('attempt_limit')
      .eq('id', examId)
      .single();
    
    if (examError) {
      console.error('Error fetching exam:', examError);
      return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 });
    }
    
    // If there's an attempt limit, check if the user has reached it
    if (examData && examData.attempt_limit !== null) {
      // Count existing attempts
      const { data: attemptData, count, error: countError } = await supabase
        .from('user_exam_attempts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('exam_id', examId);
      
      if (countError) {
        console.error('Error counting attempts:', countError);
        return NextResponse.json({ error: 'Failed to check attempt count' }, { status: 500 });
      }
      
      // If user has reached the limit, return an error
      if (count && count >= examData.attempt_limit) {
        return NextResponse.json({ 
          error: 'Attempt limit reached', 
          message: `You have reached the maximum number of attempts (${examData.attempt_limit}) for this exam.`
        }, { status: 403 });
      }
    }
    
    // Create new attempt
    const { data, error } = await supabase
      .from('user_exam_attempts')
      .insert({
        user_id: userId,
        exam_id: examId,
        started_at: new Date().toISOString(),
        completed: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating attempt:', error);
      return NextResponse.json({ error: 'Failed to create attempt' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST attempts:', error);
    return NextResponse.json({ error: 'Failed to create exam attempt' }, { status: 500 });
  }
} 