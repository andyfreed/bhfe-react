import { NextRequest, NextResponse } from 'next/server';
import type { CourseFormatEntry, CourseCredit, CourseState } from '@/types/database';

// API keys for Supabase - use service_role key to bypass RLS
const SUPABASE_URL = 'https://ujgxftkzguriirozloxa.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

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
    
    // Direct REST API call to Supabase bypassing the client - USING SERVICE ROLE KEY
    const response = await fetch(`${SUPABASE_URL}/rest/v1/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
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
    
    // Now add the formats if provided
    let insertedFormats = [];
    if (formats && formats.length > 0) {
      console.log(`Adding ${formats.length} formats for course ID:`, courseId);
      const formatsWithCourseId = formats.map((format: Partial<CourseFormatEntry>) => ({
        course_id: courseId,
        format: format.format,
        price: format.price
      }));
      
      try {
        const formatsResponse = await fetch(`${SUPABASE_URL}/rest/v1/course_formats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(formatsWithCourseId),
        });
        
        if (formatsResponse.ok) {
          insertedFormats = await formatsResponse.json();
          console.log(`Successfully added ${insertedFormats.length} formats`);
        } else {
          console.error('Error inserting formats:', await formatsResponse.text());
        }
      } catch (formatError) {
        console.error('Exception inserting formats:', formatError);
      }
    }
    
    // Now add the credits if provided
    let insertedCredits = [];
    if (credits && credits.length > 0) {
      console.log(`Adding ${credits.length} credits for course ID:`, courseId);
      const creditsWithCourseId = credits.map((credit: Partial<CourseCredit>) => ({
        course_id: courseId,
        credit_type: credit.credit_type,
        amount: credit.amount,
        course_number: credit.course_number || null
      }));
      
      try {
        const creditsResponse = await fetch(`${SUPABASE_URL}/rest/v1/course_credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(creditsWithCourseId),
        });
        
        if (creditsResponse.ok) {
          insertedCredits = await creditsResponse.json();
          console.log(`Successfully added ${insertedCredits.length} credits`);
        } else {
          console.error('Error inserting credits:', await creditsResponse.text());
        }
      } catch (creditError) {
        console.error('Exception inserting credits:', creditError);
      }
    }
    
    // Now add the states if provided
    let insertedStates = [];
    if (states && states.length > 0) {
      console.log(`Adding ${states.length} states for course ID:`, courseId);
      const statesWithCourseId = states.map((state: Partial<CourseState>) => ({
        course_id: courseId,
        state_code: state.state_code
      }));
      
      try {
        const statesResponse = await fetch(`${SUPABASE_URL}/rest/v1/course_states`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(statesWithCourseId),
        });
        
        if (statesResponse.ok) {
          insertedStates = await statesResponse.json();
          console.log(`Successfully added ${insertedStates.length} states`);
        } else {
          console.error('Error inserting states:', await statesResponse.text());
        }
      } catch (stateError) {
        console.error('Exception inserting states:', stateError);
      }
    }
    
    // Return success response with all data
    return NextResponse.json({
      success: true,
      course: insertedCourse[0],
      formats: insertedFormats,
      credits: insertedCredits,
      states: insertedStates
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