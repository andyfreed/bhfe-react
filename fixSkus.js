const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rakgwgjrhfsjqxpctvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJha2d3Z2pyaGZzanF4cGN0dnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNDE2NzYsImV4cCI6MjA1OTcxNzY3Nn0.2Hs2S-4XPN8R7IeUF_7hPSDfPvamPgN0QPwNSPn1nvE';

async function fixEmptySKUs() {
  try {
    console.log('Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    
    // Find courses with empty SKUs
    console.log('Finding courses with empty SKUs...');
    const { data, error } = await supabase
      .from('courses')
      .select('id, sku, title')
      .or('sku.is.null,sku.eq.');
    
    if (error) {
      console.error('Error finding courses with empty SKUs:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No courses with empty SKUs found.');
      return;
    }
    
    console.log(`Found ${data.length} courses with empty SKUs:`);
    data.forEach((course) => {
      console.log(`- ID: ${course.id}, Title: ${course.title}`);
    });
    
    // Update each course with a unique SKU
    console.log('\nUpdating courses...');
    for (const course of data) {
      const newSku = `AUTO-FIX-${course.id.substring(0, 8)}`;
      console.log(`Updating course ${course.id} with new SKU: ${newSku}`);
      
      const { error: updateError } = await supabase
        .from('courses')
        .update({ sku: newSku })
        .eq('id', course.id);
      
      if (updateError) {
        console.error(`Error updating course ${course.id}:`, updateError);
      } else {
        console.log(`Successfully updated course ${course.id}`);
      }
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixEmptySKUs(); 