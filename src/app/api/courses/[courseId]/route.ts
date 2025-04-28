import { NextRequest, NextResponse } from 'next/server';
import { getCourseWithRelations, updateCourse, deleteCourse } from '@/lib/courses';
import { uploadFileFromServer } from '@/lib/supabase';
import { getServerAdminToken, isValidAdminToken } from '@/lib/serverCookies';
import type { CourseFormatEntry, CourseCredit, CourseState, CourseFormat } from '@/types/database';

// Utility function to check if a URL is accessible
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    if (!url || !url.startsWith('http')) {
      console.log(`Invalid URL format: ${url}`);
      return false;
    }
    
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
  }
}

async function verifyAuth(request: NextRequest) {
  try {
    // Log environment for debugging
    console.log('Current environment:', process.env.NODE_ENV);
    
    // Get token from cookies
    const token = request.cookies.get('admin_token')?.value;
    console.log('Found token in cookies:', !!token);
    
    // Always allow in development mode for testing
    if (process.env.NODE_ENV !== 'production') {
      if (token === 'super-secure-admin-token-for-development') {
        console.log('Development token accepted');
        return;
      }
    }
    
    // Check against ADMIN_TOKEN environment variable
    const validToken = process.env.ADMIN_TOKEN;
    if (token === validToken) {
      console.log('Valid admin token provided');
      return;
    }
    
    console.error('Invalid or missing admin token');
    throw new Error('Unauthorized');
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
    await verifyAuth(request);
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
    await verifyAuth(request);
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
      
      console.log("TOC file type:", tocFile ? typeof tocFile : 'null', tocFile ? Object.prototype.toString.call(tocFile) : '');
      console.log("TOC file properties:", tocFile ? Object.getOwnPropertyNames(tocFile) : 'null');
      
      // Upload files if they exist
      if (tocFile && tocFile.size > 0) {
        try {
          console.log("Processing TOC file:", {
            name: tocFile.name,
            size: tocFile.size,
            type: Object.prototype.toString.call(tocFile)
          });
          
          // Convert File to ArrayBuffer then to Buffer
          const tocArrayBuffer = await tocFile.arrayBuffer();
          const tocBuffer = Buffer.from(tocArrayBuffer);
          
          const tocPath = `courses/${courseId}/toc-${Date.now()}-${tocFile.name}`;
          console.log("Uploading TOC file to path:", tocPath);
          
          const tocUploadResult = await uploadFileFromServer(
            tocBuffer, 
            tocFile.name,
            'course-files', 
            tocPath
          );
          
          if (tocUploadResult.error) {
            console.error("TOC file upload error:", tocUploadResult.error);
            throw new Error(`TOC upload failed: ${tocUploadResult.error.message}`);
          }
          
          if (!tocUploadResult.data || !tocUploadResult.data.publicUrl) {
            console.error("TOC file upload returned invalid data:", tocUploadResult);
            throw new Error("TOC upload failed: No public URL returned");
          }
          
          courseData.table_of_contents_url = tocUploadResult.data.publicUrl;
          console.log('Updated TOC file URL:', courseData.table_of_contents_url);
          
          // Verify the URL is accessible
          const isAccessible = await isUrlAccessible(courseData.table_of_contents_url);
          console.log(`TOC file accessible: ${isAccessible}`);
          
          if (!isAccessible) {
            console.warn('TOC file URL is not accessible, it may not be public or the bucket permissions might need adjustment');
          }
        } catch (error) {
          console.error('Error converting and uploading TOC file:', error);
          // Don't throw here to allow the update to continue with other fields
        }
      }
      
      if (contentFile && contentFile.size > 0) {
        try {
          console.log("Processing content file:", {
            name: contentFile.name,
            size: contentFile.size,
            type: Object.prototype.toString.call(contentFile)
          });
          
          // Convert File to ArrayBuffer then to Buffer
          const contentArrayBuffer = await contentFile.arrayBuffer();
          const contentBuffer = Buffer.from(contentArrayBuffer);
          
          const contentPath = `courses/${courseId}/content-${Date.now()}-${contentFile.name}`;
          console.log("Uploading content file to path:", contentPath);
          
          const contentUploadResult = await uploadFileFromServer(
            contentBuffer,
            contentFile.name,
            'course-files',
            contentPath
          );
          
          if (contentUploadResult.error) {
            console.error("Content file upload error:", contentUploadResult.error);
            throw new Error(`Content upload failed: ${contentUploadResult.error.message}`);
          }
          
          if (!contentUploadResult.data || !contentUploadResult.data.publicUrl) {
            console.error("Content file upload returned invalid data:", contentUploadResult);
            throw new Error("Content upload failed: No public URL returned");
          }
          
          courseData.course_content_url = contentUploadResult.data.publicUrl;
          console.log('Updated content file URL:', courseData.course_content_url);
          
          // Verify the URL is accessible
          const isAccessible = await isUrlAccessible(courseData.course_content_url);
          console.log(`Content file accessible: ${isAccessible}`);
          
          if (!isAccessible) {
            console.warn('Content file URL is not accessible, it may not be public or the bucket permissions might need adjustment');
          }
        } catch (error) {
          console.error('Error converting and uploading content file:', error);
          // Don't throw here to allow the update to continue with other fields
        }
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
    await verifyAuth(request);
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