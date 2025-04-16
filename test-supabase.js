// Simple script to test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '.env.local') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 8) + '...' : 'Not set');
console.log('Supabase Key:', supabaseKey ? 'Set (starts with: ' + supabaseKey.substring(0, 10) + '...)' : 'Not set');

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase credentials not found in environment variables.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to query the users table
    console.log('Querying users table...');
    const { data: users, error: usersError } = await supabase.from('users').select('id, email').limit(5);
    
    if (usersError) {
      console.error('Error querying users:', usersError);
    } else {
      console.log('Users query successful:', users ? `Found ${users.length} users` : 'No users found');
      console.log(users);
    }
    
    // Try to query the courses table
    console.log('\nQuerying courses table...');
    const { data: courses, error: coursesError } = await supabase.from('courses').select('id, title').limit(5);
    
    if (coursesError) {
      console.error('Error querying courses:', coursesError);
    } else {
      console.log('Courses query successful:', courses ? `Found ${courses.length} courses` : 'No courses found');
      console.log(courses);
    }
    
    // Try to query the enrollments table
    console.log('\nQuerying enrollments table...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id')
      .limit(5);
    
    if (enrollmentsError) {
      console.error('Error querying enrollments:', enrollmentsError);
    } else {
      console.log('Enrollments query successful:', enrollments ? `Found ${enrollments.length} enrollments` : 'No enrollments found');
      console.log(enrollments);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSupabase(); 