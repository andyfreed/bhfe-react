import { NextResponse } from 'next/server';
import { createCourse, updateCourse, getCourses, deleteCourse, deleteAllCourses } from '@/lib/courses';
import type { Course, CourseFormatEntry, CourseCredit, CourseState, CourseFormat } from '@/types/database';
import { cookies } from 'next/headers';
import { createServerSupabaseClient, uploadFileFromServer } from '@/lib/supabase';

// Valid course formats from the enum
const VALID_FORMATS: CourseFormat[] = ['online', 'hardcopy', 'video'];

async function verifyAuth() {
  try {
    // In development, allow without token to simplify testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Authentication bypassed');
      return;
    }
    
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
    
    // Create server client that bypasses RLS
    const supabase = createServerSupabaseClient();
    
    // Use a simpler approach to avoid RLS issues
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('title');
    
    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return NextResponse.json({ error: coursesError.message }, { status: 500 });
    }
    
    // Return simple course data
    console.log(`Returning ${courses?.length || 0} courses`);
    return NextResponse.json(courses || []);
  } catch (error: any) {
    console.error('Error in admin courses API:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error' },
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
        try {
          // Convert File to ArrayBuffer then to Buffer
          const tocArrayBuffer = await tocFile.arrayBuffer();
          const tocBuffer = Buffer.from(tocArrayBuffer);
          
          const tocPath = `courses/${Date.now()}-${tocFile.name}`;
          const tocResult = await uploadFileFromServer(
            tocBuffer,
            tocFile.name,
            'course-files', 
            tocPath
          );
          console.log('Uploaded TOC file result:', tocResult);
          
          if (tocResult.data && tocResult.data.publicUrl) {
            courseData.table_of_contents_url = tocResult.data.publicUrl;
          } else {
            console.error('Failed to get public URL for TOC file:', tocResult.error);
            return NextResponse.json(
              { error: 'Failed to upload table of contents file' },
              { status: 500 }
            );
          }
        } catch (error) {
          console.error('Error converting and uploading TOC file:', error);
          return NextResponse.json(
            { error: 'Error processing table of contents file' },
            { status: 500 }
          );
        }
      }
      
      if (contentFile && contentFile.size > 0) {
        try {
          // Convert File to ArrayBuffer then to Buffer
          const contentArrayBuffer = await contentFile.arrayBuffer();
          const contentBuffer = Buffer.from(contentArrayBuffer);
          
          const contentPath = `courses/${Date.now()}-${contentFile.name}`;
          const contentResult = await uploadFileFromServer(
            contentBuffer,
            contentFile.name,
            'course-files',
            contentPath
          );
          console.log('Uploaded content file result:', contentResult);
          
          if (contentResult.data && contentResult.data.publicUrl) {
            courseData.course_content_url = contentResult.data.publicUrl;
          } else {
            console.error('Failed to get public URL for content file:', contentResult.error);
            return NextResponse.json(
              { error: 'Failed to upload course content file' },
              { status: 500 }
            );
          }
        } catch (error) {
          console.error('Error converting and uploading content file:', error);
          return NextResponse.json(
            { error: 'Error processing course content file' },
            { status: 500 }
          );
        }
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
        try {
          // Convert File to ArrayBuffer then to Buffer
          const tocArrayBuffer = await tocFile.arrayBuffer();
          const tocBuffer = Buffer.from(tocArrayBuffer);
          
          const tocPath = `courses/${courseId}/toc-${Date.now()}-${tocFile.name}`;
          const tocResult = await uploadFileFromServer(
            tocBuffer,
            tocFile.name,
            'course-files', 
            tocPath
          );
          console.log('Updated TOC file result:', tocResult);
          
          if (tocResult.data && tocResult.data.publicUrl) {
            courseData.table_of_contents_url = tocResult.data.publicUrl;
          } else {
            console.error('Failed to get public URL for TOC file:', tocResult.error);
            return NextResponse.json(
              { error: 'Failed to upload table of contents file' },
              { status: 500 }
            );
          }
        } catch (error) {
          console.error('Error converting and uploading TOC file:', error);
          return NextResponse.json(
            { error: 'Error processing table of contents file' },
            { status: 500 }
          );
        }
      }
      
      if (contentFile && contentFile.size > 0) {
        try {
          // Convert File to ArrayBuffer then to Buffer
          const contentArrayBuffer = await contentFile.arrayBuffer();
          const contentBuffer = Buffer.from(contentArrayBuffer);
          
          const contentPath = `courses/${courseId}/content-${Date.now()}-${contentFile.name}`;
          const contentResult = await uploadFileFromServer(
            contentBuffer,
            contentFile.name,
            'course-files',
            contentPath
          );
          console.log('Updated content file result:', contentResult);
          
          if (contentResult.data && contentResult.data.publicUrl) {
            courseData.course_content_url = contentResult.data.publicUrl;
          } else {
            console.error('Failed to get public URL for content file:', contentResult.error);
            return NextResponse.json(
              { error: 'Failed to upload course content file' },
              { status: 500 }
            );
          }
        } catch (error) {
          console.error('Error converting and uploading content file:', error);
          return NextResponse.json(
            { error: 'Error processing course content file' },
            { status: 500 }
          );
        }
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