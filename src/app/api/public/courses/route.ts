import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// This is a public endpoint that doesn't require authentication
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get courses with their relations
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        formats:course_formats(*),
        credits:course_credits(*),
        states:course_states(*)
      `)
      .order('title');

    if (error) {
      console.error('Error fetching public courses:', error);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
} 