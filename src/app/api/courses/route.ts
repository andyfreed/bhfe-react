import { NextResponse } from 'next/server';
import { createCourse, updateCourse, getCourses, deleteCourse, deleteAllCourses } from '@/lib/courses';
import type { Course, CourseFormatEntry, CourseCredit, CourseState, CourseFormat } from '@/types/database';
import { cookies } from 'next/headers';
import { createServerSupabaseClient, uploadFileFromServer } from '@/lib/supabase';

// Valid course formats from the enum
const VALID_FORMATS: CourseFormat[] = ['online', 'hardcopy', 'video'];

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

export async function GET() {
  try {
    await verifyAuth();
    
    // Updated to get courses with relations
    const supabase = await createServerSupabaseClient();
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
      console.error('Error fetching courses with relations:', error);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/courses - Starting...');
    await verifyAuth();
    console.log('POST /api/courses - Authentication passed');
    
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
        table_of_contents_url: '',
        course_content_url: '',
      };
      
      // Parse JSON strings from form data
      formats = JSON.parse(formData.get('formats') as string || '[]');
      credits = JSON.parse(formData.get('credits') as string || '[]');
      states = JSON.parse(formData.get('states') as string || '[]');
      
      // Handle file uploads
      const tocFile = formData.get('table_of_contents_file') as File;
      const contentFile = formData.get('course_content_file') as File;
      
      // Upload files if they exist
      if (tocFile && tocFile.size > 0) {
        const tocPath = `courses/${Date.now()}-${tocFile.name}`;
        courseData.table_of_contents_url = await uploadFileFromServer(
          tocFile, 
          'course-files', 
          tocPath
        );
        console.log('Uploaded TOC file:', courseData.table_of_contents_url);
      }
      
      if (contentFile && contentFile.size > 0) {
        const contentPath = `courses/${Date.now()}-${contentFile.name}`;
        courseData.course_content_url = await uploadFileFromServer(
          contentFile,
          'course-files',
          contentPath
        );
        console.log('Uploaded content file:', courseData.course_content_url);
      }
    } else {
      // Handle regular JSON request
      const data = await request.json();
      console.log('POST /api/courses - Received data:', data);
      
      courseData = {
        sku: data.sku,
        title: data.title,
        description: data.description,
        main_subject: data.main_subject,
        author: data.author,
        table_of_contents_url: data.table_of_contents_url || '',
        course_content_url: data.course_content_url || '',
      };
      
      formats = data.formats || [];
      credits = data.credits || [];
      states = data.states || [];
    }
    
    // Validate formats
    for (const format of formats) {
      const formatLower = format.format.toLowerCase() as CourseFormat;
      if (!VALID_FORMATS.includes(formatLower)) {
        console.error(`Invalid format: ${format.format}. Valid formats are: ${VALID_FORMATS.join(', ')}`);
        return NextResponse.json(
          { error: `Invalid format: ${format.format}. Valid formats are: ${VALID_FORMATS.join(', ')}` },
          { status: 400 }
        );
      }
      // Always set format to lowercase to match the database enum
      format.format = formatLower;
    }

    console.log('POST /api/courses - Prepared course data:', courseData);
    
    const course = await createCourse(
      courseData,
      formats,
      credits,
      states
    );

    console.log('POST /api/courses - Course created successfully');
    return NextResponse.json(course);
  } catch (error: any) {
    console.error('Error creating course in API route:', error);
    return NextResponse.json(
      { error: 'Failed to create course', details: error?.message || 'Unknown error' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await verifyAuth();
    
    // Check if the request is multipart form data
    const contentType = request.headers.get('content-type') || '';
    let courseId: string;
    let courseData: any;
    let formats: CourseFormatEntry[] = [];
    let credits: CourseCredit[] = [];
    let states: CourseState[] = [];
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data with files
      const formData = await request.formData();
      courseId = formData.get('id') as string;
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
      courseId = data.id;
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
      { error: 'Failed to update course' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await verifyAuth();
    
    // Check if this is a bulk delete request by checking if there's no specific ID
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    
    // If we only have 'api' and 'courses' in the path, it's a bulk delete
    if (segments.length === 2 && segments[1] === 'courses') {
      await deleteAllCourses();
      return NextResponse.json({ success: true, message: 'All courses deleted successfully' });
    }
    
    // If we have a specific ID, delete that course
    const courseId = segments[segments.length - 1];
    if (!courseId) {
      return NextResponse.json({ error: 'No course ID provided' }, { status: 400 });
    }
    
    await deleteCourse(courseId);
    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 