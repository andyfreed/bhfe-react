import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  state_code: string;
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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || '';
    const subject = searchParams.get('subject') || '';
    const minPrice = searchParams.get('minPrice') || '0';
    const maxPrice = searchParams.get('maxPrice') || '10000';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create Supabase client with environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let courseQuery = supabase
      .from('courses')
      .select(`
        *,
        formats:course_formats(id, format, price),
        credits:course_credits(id, credit_type, amount)
      `);

    if (query) {
      courseQuery = courseQuery.ilike('title', `%${query}%`);
    }

    const { data: courses, error } = await courseQuery;

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    // Log detailed information about the first course
    if (courses && courses.length > 0) {
      console.log('First course example:');
      console.log(JSON.stringify(courses[0], null, 2));
      
      // Log specifically about credits and formats
      console.log('Credits for first course:', courses[0].credits);
      console.log('Formats for first course:', courses[0].formats);
      
      // Log count of courses with empty credits
      const emptyCreditsCourses = courses.filter(course => !course.credits || course.credits.length === 0).length;
      console.log(`Number of courses with empty credits: ${emptyCreditsCourses} out of ${courses.length}`);
    } else {
      console.log('No courses found');
    }

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error in courses API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 