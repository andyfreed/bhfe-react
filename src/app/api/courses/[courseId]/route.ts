import { NextRequest, NextResponse } from 'next/server';
import { getCourseWithRelations, updateCourse, deleteCourse } from '@/lib/courses';
import { cookies } from 'next/headers';
import { uploadFileFromServer } from '@/lib/supabase';
import type { CourseFormatEntry, CourseCredit, CourseState, CourseFormat } from '@/types/database';

async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token || token.value !== 'temporary-token') {
      console.error('Authentication failed: Token missing or invalid');
      throw new Error('Unauthorized');
    }
    console.log('Authentication successful');
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Unauthorized');
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    await verifyAuth();
    // Await the params object before accessing its properties
    const params = await context.params;
    const courseId = params.courseId;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    const course = await getCourseWithRelations(courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(course);
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    await verifyAuth();
    // Await the params object before accessing its properties
    const params = await context.params;
    const courseId = params.courseId;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the request is multipart form data
    const contentType = request.headers.get('content-type') || '';
    let courseData: any;
    let formats: CourseFormatEntry[] = [];
    let credits: CourseCredit[] = [];
    let states: CourseState[] = [];
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data with files
      const formData = await request.formData();
      courseData = {
        sku: formData.get('sku') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        main_subject: formData.get('main_subject') as string,
        author: formData.get('author') as string,
        // Keep existing URLs by default
        table_of_contents_url: formData.get('table_of_contents_url') as string,
        course_content_url: formData.get('course_content_url') as string,
      };
      
      // Parse JSON strings from form data
      formats = JSON.parse(formData.get('formats') as string || '[]');
      credits = JSON.parse(formData.get('credits') as string || '[]');
      states = JSON.parse(formData.get('states') as string || '[]');
      
      console.log("Processing form data for course update:", courseId);
      
      // Handle file uploads
      const tocFile = formData.get('table_of_contents_file') as File;
      const contentFile = formData.get('course_content_file') as File;
      
      // Upload files if they exist
      if (tocFile && tocFile.size > 0) {
        const tocPath = `courses/${courseId}/toc-${Date.now()}-${tocFile.name}`;
        courseData.table_of_contents_url = await uploadFileFromServer(
          tocFile, 
          'course-files', 
          tocPath
        );
        console.log('Updated TOC file:', courseData.table_of_contents_url);
      }
      
      if (contentFile && contentFile.size > 0) {
        const contentPath = `courses/${courseId}/content-${Date.now()}-${contentFile.name}`;
        courseData.course_content_url = await uploadFileFromServer(
          contentFile,
          'course-files',
          contentPath
        );
        console.log('Updated content file:', courseData.course_content_url);
      }
    } else {
      // Handle regular JSON request
      const data = await request.json();
      courseData = {
        sku: data.sku,
        title: data.title,
        description: data.description,
        main_subject: data.main_subject,
        author: data.author,
        table_of_contents_url: data.table_of_contents_url,
        course_content_url: data.course_content_url,
      };
      
      formats = data.formats || [];
      credits = data.credits || [];
      states = data.states || [];
    }

    // Update the course
    const course = await updateCourse(
      courseId,
      courseData,
      formats,
      credits,
      states
    );

    return NextResponse.json(course);
  } catch (error: any) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course', details: error?.message || 'Unknown error' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    await verifyAuth();
    // Await the params object before accessing its properties
    const params = await context.params;
    const courseId = params.courseId;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    await deleteCourse(courseId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course', details: error?.message || 'Unknown error' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 