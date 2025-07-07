import { createServerSupabaseClient } from '../src/lib/supabaseServer';
import { getCourses } from '../src/lib/courses';

async function loginAdmin() {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (error) {
      console.error('Login error:', error);
      return;
    }
    
    console.log('Login successful:', data);
    
    // Test fetching courses
    const courses = await getCourses();
    console.log('Courses:', courses);
  } catch (error) {
    console.error('Error:', error);
  }
}

loginAdmin(); 