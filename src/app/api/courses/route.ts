import { NextResponse } from 'next/server';
import { createCourse, updateCourse, getCourses, deleteCourse } from '@/lib/courses';
import type { CourseFormatEntry, CourseCredit, CourseState } from '@/types/database';

export async function GET() {
  try {
    const courses = await getCourses();
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const course = await createCourse(
      {
        sku: data.sku,
        title: data.title,
        description: data.description,
        main_subject: data.main_subject,
        author: data.author,
        table_of_contents_url: data.table_of_contents_url,
        course_content_url: data.course_content_url,
      },
      data.formats as Omit<CourseFormatEntry, 'id' | 'course_id' | 'created_at'>[],
      data.credits as Omit<CourseCredit, 'id' | 'course_id' | 'created_at'>[],
      data.states as Omit<CourseState, 'id' | 'course_id' | 'created_at'>[]
    );

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...courseData } = data;

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
      courseData.formats,
      courseData.credits,
      courseData.states
    );

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) throw new Error('No course ID provided');

    await deleteCourse(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
} 