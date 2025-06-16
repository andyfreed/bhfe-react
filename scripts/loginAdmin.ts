import { createServerSupabaseClient } from './src/lib/supabaseServer';
import { getCourses } from './src/lib/courses';
import { cookies } from 'next/headers';

async function loginAndCheckCourses() {
  try {
    // Get courses directly from the database
    const courses = await getCourses();
    
    console.log(`Total courses in database: ${courses?.length || 0}`);
    
    if (courses && courses.length > 0) {
      console.log('\nSample courses:');
      courses.slice(0, 3).forEach((course, index) => {
        console.log(`Course ${index + 1}:`, {
          id: course.id,
          sku: course.sku,
          title: course.title,
          author: course.author
        });
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

loginAndCheckCourses(); 