import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Define types for our course credit
interface CourseCredit {
  credit_type: string;
  amount: number;
  course_number?: string;
  course_id: string;
}

interface CourseFormat {
  id: string;
  course_id: string;
  format: string;
  price: number;
  created_at: string;
  updated_at: string;
}

interface CourseState {
  id: string;
  course_id: string;
  state: string;
  created_at: string;
  updated_at: string;
}

interface BaseCourse {
  id: string;
  title: string;
  description: string;
  sku: string;
  author: string;
  main_subject: string;
  created_at: string;
  updated_at: string;
  table_of_contents_url: string | null;
  course_content_url: string | null;
}

interface EnrichedCourse extends BaseCourse {
  formats?: CourseFormat[];
  credits?: CourseCredit[];
  states?: CourseState[];
}

// This is a public endpoint that doesn't require authentication
export async function GET(request: NextRequest) {
  try {
    // Create server client that bypasses RLS
    const supabase = createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query parameters
    const creditType = searchParams.get('creditType');
    const subject = searchParams.get('subject');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'title-asc';
    const limit = parseInt(searchParams.get('limit') || '1000');
    
    // Use a much simpler approach to avoid RLS issues
    try {
      // First get the basic course information
      let query = supabase
        .from('courses')
        .select('*');
      
      // Apply filters
      if (search) {
        // Search in title, description, author, main_subject
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%,main_subject.ilike.%${search}%`);
      }
      
      if (subject) {
        query = query.eq('main_subject', subject);
      }
      
      // Apply sorting
      if (sort === 'title-asc') {
        query = query.order('title', { ascending: true });
      } else if (sort === 'title-desc') {
        query = query.order('title', { ascending: false });
      }
      
      const { data: courses, error: coursesError } = await query;
      
      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return NextResponse.json({ error: coursesError.message }, { status: 500 });
      }
      
      // Return just the basic course data if we can't get the detailed info
      if (!courses || courses.length === 0) {
        return NextResponse.json([]);
      }
      
      // Return simple course data
      return NextResponse.json(courses);
    } catch (error) {
      console.error('Error processing request:', error);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in public courses API:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
} 