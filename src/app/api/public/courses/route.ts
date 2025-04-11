import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Define types for our course credit
interface CourseCredit {
  credit_type: string;
  amount: number;
  course_number?: string;
}

// This is a public endpoint that doesn't require authentication
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query parameters
    const creditType = searchParams.get('creditType');
    const subject = searchParams.get('subject');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'title-asc';
    const limit = parseInt(searchParams.get('limit') || '1000');
    
    // Start building the query
    let query = supabase
      .from('courses')
      .select(`
        *,
        formats:course_formats(*),
        credits:course_credits(*),
        states:course_states(*)
      `);
    
    // Apply filters
    if (search) {
      // Search in title, description, author, main_subject
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%,main_subject.ilike.%${search}%`);
    }
    
    if (subject) {
      query = query.eq('main_subject', subject);
    }
    
    // Apply sorting
    switch (sort) {
      case 'title-asc':
        query = query.order('title', { ascending: true });
        break;
      case 'title-desc':
        query = query.order('title', { ascending: false });
        break;
      case 'price-asc':
        // Price sorting needs to be handled in post-processing
        break;
      case 'price-desc':
        // Price sorting needs to be handled in post-processing
        break;
      default:
        query = query.order('title', { ascending: true });
    }
    
    // Only apply limit if requested - otherwise fetch all
    if (searchParams.has('limit')) {
      query = query.limit(limit);
    }
    
    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching public courses:', error);
      throw error;
    }
    
    // If creditType filter is applied, we need to post-process the results
    // because we can't directly filter on the joined credits table in Supabase
    let filteredData = data;
    if (creditType) {
      filteredData = data.filter(course => 
        course.credits && 
        course.credits.some((credit: CourseCredit) => 
          credit.credit_type.toUpperCase() === creditType.toUpperCase()
        )
      );
    }
    
    // Handle price sorting in post-processing since it depends on the lowest format price
    if (sort === 'price-asc' || sort === 'price-desc') {
      filteredData = [...filteredData].sort((a, b) => {
        const aPrice = a.formats?.length > 0 ? Math.min(...a.formats.map((f: { price: number }) => f.price)) : 0;
        const bPrice = b.formats?.length > 0 ? Math.min(...b.formats.map((f: { price: number }) => f.price)) : 0;
        return sort === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
      });
    }
    
    console.log(`Returning ${filteredData.length} courses`);
    return NextResponse.json(filteredData);
  } catch (error: any) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
} 