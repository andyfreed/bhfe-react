import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token');
    
    if (!token) {
      console.error('Authentication failed: Token missing');
      throw new Error('Unauthorized');
    }
    console.log('User authentication successful');
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Unauthorized');
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    await verifyAuth();
    
    const attemptId = params.attemptId;
    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { questionId, selectedOption } = body;
    
    if (!questionId || !selectedOption) {
      return NextResponse.json(
        { error: 'Question ID and selected option are required' },
        { status: 400 }
      );
    }
    
    const supabase = await createServerSupabaseClient();
    
    // Check if an answer already exists for this question
    const { data: existingAnswer, error: checkError } = await supabase
      .from('user_exam_answers')
      .select('id')
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing answer:', checkError);
      throw checkError;
    }
    
    let result;
    
    if (existingAnswer) {
      // Update existing answer
      const { data, error } = await supabase
        .from('user_exam_answers')
        .update({ selected_option: selectedOption })
        .eq('id', existingAnswer.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating answer:', error);
        throw error;
      }
      
      result = data;
    } else {
      // Create new answer
      const { data, error } = await supabase
        .from('user_exam_answers')
        .insert({
          attempt_id: attemptId,
          question_id: questionId,
          selected_option: selectedOption
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating answer:', error);
        throw error;
      }
      
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { error: 'Error saving answer' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 