import { NextResponse } from 'next/server';
import { createCourse, updateCourse, getCourses, deleteCourse } from '@/lib/courses';
import type { Course, CourseFormatEntry, CourseCredit, CourseState, CourseFormat } from '@/types/database';
import { cookies } from 'next/headers';

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
    const courses = await getCourses();
    return NextResponse.json(courses);
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
    
    const data = await request.json();
    console.log('POST /api/courses - Received data:', data);
    
    // Validate formats
    if (data.formats && Array.isArray(data.formats)) {
      for (const format of data.formats) {
        const formatLower = format.format.toLowerCase();
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
    }
    
    // Only include the base course fields in courseData
    const courseData: Omit<Course, 'id' | 'created_at'> = {
      sku: data.sku,
      title: data.title,
      description: data.description,
      main_subject: data.main_subject,
      author: data.author,
      table_of_contents_url: data.table_of_contents_url || '',
      course_content_url: data.course_content_url || '',
    };

    console.log('POST /api/courses - Prepared course data:', courseData);
    
    const course = await createCourse(
      courseData,
      data.formats || [],
      data.credits || [],
      data.states || []
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
    const data = await request.json();
    const { id, ...courseData } = data;

    // Only include the base course fields in courseData
    const course = await updateCourse(
      id,
      {
        sku: courseData.sku,
        title: courseData.title,
        description: courseData.description,
        main_subject: courseData.main_subject,
        author: courseData.author,
        table_of_contents_url: courseData.table_of_contents_url,
        course_content_url: courseData.course_content_url,
      },
      courseData.formats || [],
      courseData.credits || [],
      courseData.states || []
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
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) throw new Error('No course ID provided');

    await deleteCourse(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 