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
  { params }: { params: { attemptId: string } }
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
    if (status) updateData.status = status;
    if (score !== undefined) updateData.score = score;
    if (passed !== undefined) updateData.passed = passed;
    
    // If setting status to complete, add completed_at
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
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