import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createCourse } from '@/lib/courses';
// @ts-ignore - xlsx doesn't have TypeScript types by default
import * as XLSX from 'xlsx';

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

interface CourseFormatEntry {
  format: string;
  price: number;
}

interface CourseCredit {
  credit_type: string;
  amount: number;
  course_number: string;
}

interface CourseState {
  state_code: string;
}

// Function to extract states from a string
function extractStates(statesStr: string): CourseState[] {
  if (!statesStr) return [];
  
  // Map of full state names to their two-letter codes
  const stateNameToCode: Record<string, string> = {
    'alabama': 'AL',
    'alaska': 'AK',
    'arizona': 'AZ',
    'arkansas': 'AR',
    'california': 'CA',
    'colorado': 'CO',
    'connecticut': 'CT',
    'delaware': 'DE',
    'florida': 'FL',
    'georgia': 'GA',
    'hawaii': 'HI',
    'idaho': 'ID',
    'illinois': 'IL',
    'indiana': 'IN',
    'iowa': 'IA',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maine': 'ME',
    'maryland': 'MD',
    'massachusetts': 'MA',
    'michigan': 'MI',
    'minnesota': 'MN',
    'mississippi': 'MS',
    'missouri': 'MO',
    'montana': 'MT',
    'nebraska': 'NE',
    'nevada': 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'vermont': 'VT',
    'virginia': 'VA',
    'washington': 'WA',
    'west virginia': 'WV',
    'wisconsin': 'WI',
    'wyoming': 'WY',
    'district of columbia': 'DC'
  };
  
  // Remove "All" and split by appropriate delimiter
  const cleanedStr = statesStr.replace(/All\|?/g, '');
  const statesList = cleanedStr.includes('|') 
    ? cleanedStr.split('|') 
    : cleanedStr.split(',');
  
  // Create state objects with two-letter codes
  return statesList
    .filter(state => state.trim())
    .map(state => {
      const stateName = state.trim().toLowerCase();
      // If it's already a two-letter code, use it
      if (stateName.length === 2) {
        return { state_code: stateName.toUpperCase() };
      }
      // Otherwise look up the two-letter code
      const stateCode = stateNameToCode[stateName] || '';
      if (!stateCode) {
        console.warn(`Unknown state name: ${stateName}`);
      }
      return { state_code: stateCode };
    })
    .filter(state => state.state_code); // Remove any states without a valid code
}

// Helper function to find a value from an object using multiple possible keys
function findValue(obj: Record<string, any>, keys: string[]): string | null {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return String(obj[key]).trim();
    }
  }
  return null;
}

// Helper function to extract a field with detailed logging
function extractField(obj: Record<string, any>, keys: string[], fieldName: string, rowIndex: number): string | null {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      const value = String(obj[key]).trim();
      console.log(`Row ${rowIndex + 1}: Found ${fieldName} in '${key}' field: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      return value;
    }
  }
  console.log(`Row ${rowIndex + 1}: ${fieldName} not found`);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    await verifyAuth();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file extension to handle either CSV or XLSX format
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    console.log(`Processing ${fileExt} file: ${file.name}`);

    const fileBuffer = await file.arrayBuffer();
    let rows: any[] = [];
    
    if (fileExt === 'xlsx') {
      // Process Excel file
      const workbook = XLSX.read(fileBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      console.log(`Extracted ${rows.length} rows from Excel file`);
    } else {
      // For backward compatibility, handle CSV
      const fileText = await file.text();
      // Use basic CSV parsing since we're focusing on XLSX now
      const lines = fileText.split('\n')
        .filter(line => line.trim().length > 0);
      
      // Assume first line has headers
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Parse the rest of the lines
      rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });
        
        return row;
      });
    }
    
    console.log(`Processing ${rows.length} rows of data`);
    
    // Preview the first row to see what columns we have
    if (rows.length > 0) {
      console.log('First row sample:', Object.keys(rows[0]));
    }
    
    const successfulImports = [];
    const errors = [];
    
    // Process in small batches with a delay between them
    const batchSize = 5;
    for (let batchIndex = 0; batchIndex < rows.length; batchIndex += batchSize) {
      const batch = rows.slice(batchIndex, batchIndex + batchSize);
      console.log(`Processing batch ${Math.floor(batchIndex/batchSize) + 1} of ${Math.ceil(rows.length/batchSize)}`);
      
      // Process each row in the batch
      for (let i = 0; i < batch.length; i++) {
        const rowIndex = batchIndex + i;
        try {
          const row = batch[i];
          
          // Log all available column names for debugging
          console.log(`Row ${rowIndex + 1} columns:`, Object.keys(row));
          console.log(`Row ${rowIndex + 1} raw data:`, JSON.stringify(row).substring(0, 200) + '...');
          
          // Extract title - try common header names
          let title = row.Title || row.title || row['Course Title'] || '';
          
          // Skip if no usable title found
          if (!title || title.length > 255) {
            console.log(`Row ${rowIndex + 1}: No valid title found`);
            errors.push(`Row ${rowIndex + 1}: Missing or invalid title`);
            continue;
          }
          
          // SKU handling - PRESERVE the original SKU exactly as it is
          // This section needs careful attention
          let sku = '';
          
          // Explicitly check each possible SKU field with detailed logging
          if (row.SKU) {
            sku = String(row.SKU).trim();
            console.log(`Row ${rowIndex + 1}: Found SKU in 'SKU' field: ${sku}`);
          } else if (row.sku) {
            sku = String(row.sku).trim();
            console.log(`Row ${rowIndex + 1}: Found SKU in 'sku' field: ${sku}`);
          } else if (row['Course SKU']) {
            sku = String(row['Course SKU']).trim();
            console.log(`Row ${rowIndex + 1}: Found SKU in 'Course SKU' field: ${sku}`);
          } else if (row.Course_SKU) {
            sku = String(row.Course_SKU).trim();
            console.log(`Row ${rowIndex + 1}: Found SKU in 'Course_SKU' field: ${sku}`);
          } else if (row.Internal_SKU_N) {
            sku = String(row.Internal_SKU_N).trim();
            console.log(`Row ${rowIndex + 1}: Found SKU in 'Internal_SKU_N' field: ${sku}`);
          } else {
            // Only generate if truly not found
            sku = `BH-${Date.now()}-${rowIndex}`;
            console.log(`Row ${rowIndex + 1}: No SKU found in import, generated: ${sku}`);
          }
          
          // Extract all fields with detailed logging for each field
          const description = extractField(row, ['Description', 'description', 'Course_Description', 'Course Description'], 'description', rowIndex) || '';
          const author = extractField(row, ['Author', 'author', 'Instructor', 'instructor'], 'author', rowIndex) || '';
          const mainSubject = extractField(row, ['Main_Subject', 'main_subject', 'Subject', 'subject', 'Category', 'category', 'Main Subject'], 'main_subject', rowIndex) || '';
          
          // Get URLs
          const tocUrl = extractField(row, ['Table of Contents URL', 'TOC_URL', 'TOC URL', 'Table_of_Contents_URL'], 'TOC URL', rowIndex) || '';
          const contentUrl = extractField(row, ['Course Content URL', 'Content_URL', 'Content URL', 'Course_Content_URL'], 'Content URL', rowIndex) || '';
          
          // Get states with better logging
          let statesStr = extractField(row, ['States', 'states', 'State_Approvals', 'State Approvals', 'State Codes', 'State_Codes'], 'states', rowIndex) || '';
          console.log(`Row ${rowIndex + 1}: States string:`, statesStr);
          const states = extractStates(statesStr);
          console.log(`Row ${rowIndex + 1}: Extracted state codes:`, states.map(s => s.state_code).join(', '));
          
          // Create formats with prices from the file
          const formats: CourseFormatEntry[] = [];
          
          // Online format
          const onlinePrice = parseFloat(extractField(row, ['Online Price', 'Online_Price', 'Price Online', 'Price_Online'], 'online price', rowIndex) || '0');
          if (onlinePrice > 0) {
            formats.push({ format: 'online', price: onlinePrice });
            console.log(`Row ${rowIndex + 1}: Added online format with price: $${onlinePrice}`);
          } else {
            // Add default online format if none specified
            formats.push({ format: 'online', price: 15 });
            console.log(`Row ${rowIndex + 1}: Added default online format with price: $15`);
          }
          
          // Hardcopy format
          const hardcopyPrice = parseFloat(extractField(row, ['Hardcopy Price', 'Hardcopy_Price', 'Price Hardcopy', 'Price_Hardcopy'], 'hardcopy price', rowIndex) || '0');
          if (hardcopyPrice > 0) {
            formats.push({ format: 'hardcopy', price: hardcopyPrice });
            console.log(`Row ${rowIndex + 1}: Added hardcopy format with price: $${hardcopyPrice}`);
          }
          
          // Video format
          const videoPrice = parseFloat(extractField(row, ['Video Price', 'Video_Price', 'Price Video', 'Price_Video'], 'video price', rowIndex) || '0');
          if (videoPrice > 0) {
            formats.push({ format: 'video', price: videoPrice });
            console.log(`Row ${rowIndex + 1}: Added video format with price: $${videoPrice}`);
          }
          
          // Create credits with improved extraction
          const credits: CourseCredit[] = [];
          
          // CPA Credits
          const cpaCredits = parseFloat(extractField(row, ['CPA Credits', 'CPA_Credits'], 'CPA credits', rowIndex) || '0');
          if (cpaCredits > 0) {
            const cpaCourseNumber = extractField(row, ['CPA Course Number', 'CPA_Course_Number', 'CPA_Subject'], 'CPA course number', rowIndex) || '';
            credits.push({
              credit_type: 'CPA',
              amount: cpaCredits,
              course_number: cpaCourseNumber
            });
            console.log(`Row ${rowIndex + 1}: Added CPA credits: ${cpaCredits}, course number: ${cpaCourseNumber || 'none'}`);
          }
          
          // CFP Credits
          const cfpCredits = parseFloat(extractField(row, ['CFP Credits', 'CFP_Credits'], 'CFP credits', rowIndex) || '0');
          if (cfpCredits > 0) {
            const cfpCourseNumber = extractField(row, ['CFP Course Number', 'CFP_Course_Number', 'CFP_Subject'], 'CFP course number', rowIndex) || '';
            credits.push({
              credit_type: 'CFP',
              amount: cfpCredits,
              course_number: cfpCourseNumber
            });
            console.log(`Row ${rowIndex + 1}: Added CFP credits: ${cfpCredits}, course number: ${cfpCourseNumber || 'none'}`);
          }
          
          // Create the course object with all extracted fields
          const course = {
            sku: sku.substring(0, 50), // Ensure SKU doesn't exceed max length
            title: title.substring(0, 250),
            description: description.substring(0, 2000),
            author: author.substring(0, 200),
            main_subject: mainSubject.substring(0, 95),
            table_of_contents_url: tocUrl.substring(0, 255),
            course_content_url: contentUrl.substring(0, 255)
          };
          
          // Log complete course data before insertion
          console.log(`Row ${rowIndex + 1}: Final course data to insert:`, {
            sku: course.sku,
            title: course.title.substring(0, 30) + (course.title.length > 30 ? '...' : ''),
            description_length: course.description.length,
            author: course.author || '(none)',
            main_subject: course.main_subject || '(none)',
            formats: formats.map(f => `${f.format}:$${f.price}`).join(', '),
            credits: credits.map(c => `${c.credit_type}:${c.amount}:${c.course_number || 'no-number'}`).join(', '),
            states: states.map(s => s.state_code).join(', ') || '(none)'
          });
          
          // Create the course in the database
          try {
            const createdCourse = await createCourse(course, formats, credits, states);
            console.log(`Row ${rowIndex + 1}: Successfully created course`);
            successfulImports.push({
              sku: course.sku,
              title: course.title
            });
            
            // Add a small delay between each course creation
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error: any) {
            console.error(`Row ${rowIndex + 1}: Error creating course:`, error);
            errors.push(`Row ${rowIndex + 1}: ${error.message}`);
          }
        } catch (error: any) {
          console.error(`Row ${rowIndex + 1}: Error processing row:`, error);
          errors.push(`Row ${rowIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Add a delay between batches
      console.log(`Completed batch ${Math.floor(batchIndex/batchSize) + 1}. Waiting before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log(`Import summary - Courses imported: ${successfulImports.length} Errors: ${errors.length}`);
    
    return NextResponse.json({
      imported: successfulImports.length,
      courses: successfulImports,
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