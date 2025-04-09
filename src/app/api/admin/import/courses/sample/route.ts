import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { createCourse } from '@/lib/courses';
import type { CourseFormatEntry, CourseCredit, CourseState } from '@/types/database';

// Verify admin authentication
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

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    await verifyAuth();

    // Get the sample CSV file from the public directory
    const filePath = path.join(process.cwd(), 'public', 'import-file', 'sample import.csv');
    let fileContents: string;
    
    try {
      fileContents = await fs.promises.readFile(filePath, 'utf8');
      console.log('CSV file read successfully, length:', fileContents.length);
    } catch (error) {
      console.error('Error reading sample CSV file:', error);
      return NextResponse.json(
        { error: 'Failed to read sample CSV file' },
        { status: 500 }
      );
    }
    
    // Parse the CSV file
    const rows = fileContents.split('\n');
    console.log('Number of rows in CSV:', rows.length);
    
    // Extract headers from the first row
    const headers = rows[0].split(',').map(header => header.trim());
    console.log('Headers:', headers);
    
    // Process course data from CSV
    const courses = [];
    const errors = [];
    
    // Process each row (skip the header row)
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) {
        console.log(`Row ${i} is empty, skipping`);
        continue; // Skip empty rows
      }
      
      try {
        const values = parseCSVRow(rows[i]);
        console.log(`Row ${i} values:`, values);
        
        const courseData: Record<string, any> = {};
        
        // Map CSV values to course data
        headers.forEach((header, index) => {
          if (values[index] !== undefined) {
            courseData[header] = values[index].trim();
          }
        });
        
        console.log(`Row ${i} parsed course data:`, courseData);
        
        // Map fields from the sample import CSV to our database structure
        const title = courseData.Title;
        const description = courseData['Course Description'];
        const sku = courseData['Internal SKU Number'] || '';
        
        console.log(`Row ${i} - Title: "${title}", SKU: "${sku}"`);
        
        if (!title) {
          console.error(`Row ${i + 1}: Missing required field (Title)`);
          errors.push(`Row ${i + 1}: Missing required field (Title)`);
          continue;
        }
        
        // Process formats based on pricing columns
        const formats: CourseFormatEntry[] = [];
        
        // Online format
        if (courseData['Online Price'] && parseFloat(courseData['Online Price']) > 0) {
          formats.push({
            format: 'online',
            price: parseFloat(courseData['Online Price'])
          });
        }
        
        // Hardcopy format
        if (courseData['Hardcopy Price'] && parseFloat(courseData['Hardcopy Price']) > 0) {
          formats.push({
            format: 'hardcopy',
            price: parseFloat(courseData['Hardcopy Price'])
          });
        }
        
        // Video format
        if (courseData['Video Price'] && parseFloat(courseData['Video Price']) > 0) {
          formats.push({
            format: 'video',
            price: parseFloat(courseData['Video Price'])
          });
        }
        
        console.log(`Row ${i} formats:`, formats);
        
        // Process credits
        const credits: CourseCredit[] = [];
        
        // CPA Credits
        if (courseData['CPA Credits'] && parseFloat(courseData['CPA Credits']) > 0) {
          credits.push({
            credit_type: 'CPA',
            amount: parseFloat(courseData['CPA Credits']),
            course_number: courseData['CPA Course Number'] || ''
          });
        }
        
        // CFP Credits
        if (courseData['CFP Credits'] && parseFloat(courseData['CFP Credits']) > 0) {
          credits.push({
            credit_type: 'CFP',
            amount: parseFloat(courseData['CFP Credits']),
            course_number: courseData['CFP Course Number'] || ''
          });
        }
        
        // EA/OTRP Credits - Split into EA and OTRP as separate entries
        if (courseData['EA / OTRP Credits'] && parseFloat(courseData['EA / OTRP Credits']) > 0) {
          const amount = parseFloat(courseData['EA / OTRP Credits']);
          const courseNumber = courseData['EA / OTRP Course Number'] || '';
          
          // Add EA credit
          credits.push({
            credit_type: 'EA',
            amount: amount,
            course_number: courseNumber
          });
          
          // Add OTRP credit
          credits.push({
            credit_type: 'OTRP',
            amount: amount,
            course_number: courseNumber
          });
        }
        
        // ERPA Credits
        if (courseData['ERPA Credits'] && parseFloat(courseData['ERPA Credits']) > 0) {
          credits.push({
            credit_type: 'ERPA',
            amount: parseFloat(courseData['ERPA Credits']),
            course_number: courseData['ERPA Course Number'] || ''
          });
        }
        
        // CDFA Credits
        if (courseData['CDFA Credits'] && parseFloat(courseData['CDFA Credits']) > 0) {
          credits.push({
            credit_type: 'CDFA',
            amount: parseFloat(courseData['CDFA Credits']),
            course_number: courseData['CDFA Course Number'] || ''
          });
        }
        
        console.log(`Row ${i} credits:`, credits);
        
        // Process states (pipe-separated values)
        const states: CourseState[] = [];
        if (courseData.States) {
          const stateValues = courseData.States.split('|').map((s: string) => s.trim());
          stateValues.forEach((state: string) => {
            if (state) {
              // Ensure we're using the 2-character state code
              // If the state is already a 2-char code, use it as is
              // Otherwise, use just the first 2 chars or 'XX' as fallback
              const stateCode = state.length === 2 ? state : (state.substring(0, 2).toUpperCase() || 'XX');
              states.push({ state_code: stateCode });
            }
          });
        }
        
        console.log(`Row ${i} states:`, states);
        
        // Process main subjects (pipe-separated values)
        let mainSubjects = [];
        if (courseData['Main Subjects']) {
          mainSubjects = courseData['Main Subjects'].split('|').map((s: string) => s.trim());
        }
        
        console.log(`Row ${i} main subjects:`, mainSubjects);
        
        // Get author(s)
        const author = courseData.Authors || '';
        
        // Create the main course object
        const course = {
          sku: sku,
          title: title,
          description: description || '',
          main_subject: mainSubjects[0] || '', // Use the first subject as main
          author: author,
          table_of_contents_url: '',
          course_content_url: ''
        };
        
        console.log(`Row ${i} final course object:`, course);
        
        // Create the course in the database
        try {
          const result = await createCourse(course, formats, credits, states);
          console.log(`Row ${i} course created successfully:`, result);
          courses.push(course);
        } catch (createError) {
          console.error(`Error creating course from row ${i}:`, createError);
          errors.push(`Row ${i + 1}: ${createError instanceof Error ? createError.message : 'Database error'}`);
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('Import summary - Courses imported:', courses.length, 'Errors:', errors.length);
    
    return NextResponse.json({
      imported: courses.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    console.error('Error importing courses:', error);
    return NextResponse.json(
      { error: 'Failed to import courses', details: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// Helper function to parse CSV rows that might contain commas within quoted values
function parseCSVRow(row: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    
    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current) {
    result.push(current.trim());
  }
  
  return result;
} 