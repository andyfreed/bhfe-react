import { createServerSupabaseClient } from './src/lib/supabase';

async function checkCourses() {
  try {
    const supabase = createServerSupabaseClient();
    
    console.log('Checking courses table...');
    const { data, error } = await supabase
      .from('courses')
      .select('*');
      
    if (error) {
      console.error('Error fetching courses:', error);
      return;
    }
    
    console.log(`Total courses in database: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      console.log('\nSample courses:');
      data.slice(0, 3).forEach((course, index) => {
        console.log(`Course ${index + 1}:`, {
          id: course.id,
          sku: course.sku,
          title: course.title,
          author: course.author
        });
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    process.exit(0);
  }
}

checkCourses(); 