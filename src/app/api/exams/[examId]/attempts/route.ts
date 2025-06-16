import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClientWithCookies } from '@/lib/supabaseServer';

// Fixed development user ID for bypassing auth in development mode
const DEV_USER_ID = '9e5d47c8-e363-4444-a55e-97f1f0420633';

/**
 * GET /api/exams/[examId]/attempts
 * Get all attempts for a specific exam
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { examId } = await params;
    
    // Create Supabase client
    const supabase = createServerSupabaseClientWithCookies();
    
    // Use development user ID in development mode
    let userId: string | null = process.env.NODE_ENV === 'development' ? DEV_USER_ID : null;
    
    // If not using dev ID, get user from auth
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    console.log(`Getting attempts for exam ${examId} as user ${userId}`);
    
    // Get existing attempts for this exam
    const { data: attempts, error } = await supabase
      .from('user_exam_attempts')
      .select('*')
      .eq('exam_id', examId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching attempts:', error);
      return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
    }
    
    return NextResponse.json(attempts || []);
  } catch (error) {
    console.error('Error in GET /api/exams/[examId]/attempts:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * POST /api/exams/[examId]/attempts
 * Create a new attempt for a specific exam
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { examId } = await params;
    
    // Create Supabase client
    const supabase = createServerSupabaseClientWithCookies();
    
    // Use development user ID in development mode
    let userId: string | null = process.env.NODE_ENV === 'development' ? DEV_USER_ID : null;
    
    // If not using dev ID, get user from auth
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    console.log(`Creating attempt for exam ${examId} as user ${userId}`);
    
    // Create new attempt
    const { data: newAttempt, error: createError } = await supabase
      .from('user_exam_attempts')
      .insert({
        exam_id: examId,
        user_id: userId,
        score: null,
        completed: false,
        passed: null
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating attempt:', createError);
      return NextResponse.json({ error: 'Failed to create attempt' }, { status: 500 });
    }
    
    return NextResponse.json(newAttempt, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/exams/[examId]/attempts:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 