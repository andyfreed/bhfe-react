const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rakgwgjrhfsjqxpctvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJha2d3Z2pyaGZzanF4cGN0dnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNDE2NzYsImV4cCI6MjA1OTcxNzY3Nn0.2Hs2S-4XPN8R7IeUF_7hPSDfPvamPgN0QPwNSPn1nvE';

async function checkDb() {
  try {
    console.log('Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    
    console.log('Fetching courses...');
    const { data, error } = await supabase.from('courses').select('*');
    
    if (error) {
      console.error('Error fetching courses:', error);
      return;
    }
    
    console.log(`Total courses in database: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      console.log('\nCourses:');
      data.forEach((course, index) => {
        console.log(`Course ${index + 1}:`, {
          id: course.id,
          sku: course.sku || '(empty)',
          title: course.title.substring(0, 50) + (course.title.length > 50 ? '...' : ''),
          created_at: new Date(course.created_at).toLocaleString()
        });
      });
    }
    
    // Check for empty SKU values
    const emptySku = data?.filter(course => !course.sku || course.sku === '');
    if (emptySku && emptySku.length > 0) {
      console.log(`\nWARNING: Found ${emptySku.length} courses with empty SKU values!`);
      console.log('These empty SKUs will cause "duplicate key value" errors when importing new courses.');
      
      if (emptySku.length > 0) {
        console.log('\nSuggested SQL to fix these courses:');
        emptySku.forEach(course => {
          console.log(`UPDATE courses SET sku = 'AUTO-FIX-${course.id.substring(0, 8)}' WHERE id = '${course.id}';`);
        });
      }
    }
    
    // Attempt to check database schema
    console.log('\nChecking database schema...');
    // Get course table definition
    // Note: This might not work depending on Supabase permissions
    const { data: tableInfo, error: tableError } = await supabase.rpc('schema_info', { 
      p_table: 'courses',
      p_schema: 'public'
    });
    
    if (tableError) {
      console.log('Cannot access schema information due to permission restrictions.');
    } else if (tableInfo) {
      console.log('Table schema:', tableInfo);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDb(); 