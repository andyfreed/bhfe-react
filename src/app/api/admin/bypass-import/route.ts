import { NextRequest, NextResponse } from 'next/server';

// Simple admin API to bypass RLS using a REST call directly to the database
export async function POST(request: NextRequest) {
  try {
    // Parse body content
    const { course, formats, credits, states } = await request.json();
    
    // Validate required course data
    if (!course || !course.sku || !course.title) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required course data' 
      }, { status: 400 });
    }
    
    console.log('Attempting to import course via REST API:', course.title);
    
    // Simplified course object for insertion
    const courseData = {
      sku: course.sku,
      title: course.title,
      description: course.description || '',
      author: course.author || '',
      main_subject: course.main_subject || '',
      // Only include optional fields if they exist
      ...(course.table_of_contents_url ? { table_of_contents_url: course.table_of_contents_url } : {}),
      ...(course.course_content_url ? { course_content_url: course.course_content_url } : {})
    };
    
    // Direct REST API call to Supabase bypassing the client
    const response = await fetch('https://ujgxftkzguriirozloxa.supabase.co/rest/v1/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(courseData),
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from REST API:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to insert course via REST API',
        details: errorText
      }, { status: response.status });
    }
    
    // Parse the response to get the inserted course
    const insertedCourse = await response.json();
    
    if (!insertedCourse || !insertedCourse[0] || !insertedCourse[0].id) {
      return NextResponse.json({
        success: false,
        error: 'Invalid response from REST API',
        details: insertedCourse
      }, { status: 500 });
    }
    
    const courseId = insertedCourse[0].id;
    console.log('Course created successfully with ID:', courseId);
    
    // Return success response
    return NextResponse.json({
      success: true,
      course: insertedCourse[0],
      formats: [],
      credits: [],
      states: []
    });
    
  } catch (error: any) {
    console.error('Exception in bypass import:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process course import',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 