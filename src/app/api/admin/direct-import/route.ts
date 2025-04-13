import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use direct client with anon key for development as a workaround
const directClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    }
  }
);

export async function POST(req: NextRequest) {
  try {
    // Simple authentication - only in production
    if (process.env.NODE_ENV === 'production') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const token = authHeader.replace('Bearer ', '');
      // In production, validate token against expected admin token
      if (token !== process.env.ADMIN_API_TOKEN) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      }
    } else {
      console.log('Development mode: bypassing authentication for direct import');
    }
    
    // Parse request body
    const { course, formats, credits, states } = await req.json();
    
    console.log('Direct import course:', course?.title);
    
    if (!course || !course.sku) {
      return NextResponse.json({ error: 'Missing course data' }, { status: 400 });
    }
    
    // Use direct client with service role key to bypass RLS
    const { data: insertedCourse, error: courseError } = await directClient
      .from('courses')
      .insert({
        sku: course.sku,
        title: course.title || '',
        description: course.description || '',
        author: course.author || '',
        main_subject: course.main_subject || '',
        table_of_contents_url: course.table_of_contents_url || null,
        course_content_url: course.course_content_url || null,
      })
      .select()
      .single();
      
    if (courseError) {
      console.error('Error inserting course with direct client:', courseError);
      return NextResponse.json({ 
        error: 'Failed to insert course', 
        details: courseError
      }, { status: 500 });
    }
    
    const courseId = insertedCourse.id;
    let formatResults: any[] = [];
    let creditResults: any[] = [];
    let stateResults: any[] = [];
    
    // Insert formats if provided
    if (formats && formats.length > 0) {
      try {
        const formatsToInsert = formats.map((format: any) => ({
          course_id: courseId,
          format: format.format,
          price: format.price
        }));
        
        const { data, error } = await directClient
          .from('course_formats')
          .insert(formatsToInsert)
          .select();
          
        if (error) {
          console.error('Error inserting formats:', error);
        } else if (data) {
          formatResults = data;
        }
      } catch (error) {
        console.error('Exception inserting formats:', error);
      }
    }
    
    // Insert credits if provided
    if (credits && credits.length > 0) {
      try {
        const creditsToInsert = credits.map((credit: any) => ({
          course_id: courseId,
          credit_type: credit.credit_type,
          amount: credit.amount,
          course_number: credit.course_number || null
        }));
        
        const { data, error } = await directClient
          .from('course_credits')
          .insert(creditsToInsert)
          .select();
          
        if (error) {
          console.error('Error inserting credits:', error);
        } else if (data) {
          creditResults = data;
        }
      } catch (error) {
        console.error('Exception inserting credits:', error);
      }
    }
    
    // Insert states if provided
    if (states && states.length > 0) {
      try {
        const statesToInsert = states.map((state: any) => ({
          course_id: courseId,
          state: state.state_code
        }));
        
        const { data, error } = await directClient
          .from('course_states')
          .insert(statesToInsert)
          .select();
          
        if (error) {
          console.error('Error inserting states:', error);
        } else if (data) {
          stateResults = data;
        }
      } catch (error) {
        console.error('Exception inserting states:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      course: insertedCourse,
      formats: formatResults,
      credits: creditResults,
      states: stateResults
    });
    
  } catch (error: any) {
    console.error('Error in direct import:', error);
    return NextResponse.json({
      error: 'Failed to process direct import',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 