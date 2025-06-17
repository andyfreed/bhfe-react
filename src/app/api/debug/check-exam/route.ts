import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const examId = url.searchParams.get('examId');
    const courseId = url.searchParams.get('courseId');
    
    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let query = supabase.from('exams').select('*');
    
    if (examId) {
      // Check specific exam ID
      query = query.eq('id', examId);
    } else if (courseId) {
      // Get all exams for a course
      query = query.eq('course_id', courseId);
    } else {
      // Get all exams (limit to 10)
      query = query.limit(10);
    }
    
    const { data: exams, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message });
    }
    
    // Also check if there are any malformed IDs
    const malformedExams = exams?.filter(exam => {
      const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return !idPattern.test(exam.id);
    });
    
    return NextResponse.json({
      exams,
      malformedExams,
      examCount: exams?.length || 0,
      note: examId ? `Checking exam ID: ${examId}` : courseId ? `Exams for course: ${courseId}` : 'Recent exams'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to check exams', 
      message: error.message 
    });
  }
} 