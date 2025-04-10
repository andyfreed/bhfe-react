import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { createCourse } from '@/lib/courses';
import type { CourseFormatEntry, CourseCredit, CourseState } from '@/types/database';
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

export async function POST(request: NextRequest) {
  try {
    await verifyAuth();
    
    // Create a workbook with sample data for XLSX
    const wb = XLSX.utils.book_new();
    
    const sampleData = [
      {
        "Title": "Sample Course Title",
        "SKU": "123456",
        "Description": "This is a sample course description that explains what the course is about.",
        "Author": "Steven M. Bragg",
        "Main Subject": "Accounting",
        "States": "AL|AK|AZ|CA",
        "CPA Credits": "2",
        "CPA Course Number": "ABC123",
        "CFP Credits": "1",
        "CFP Course Number": "CFP345",
        "Online Price": "15",
        "Hardcopy Price": "25"
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, "Courses");
    
    // Get XLSX as binary string
    const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Return XLSX file
    return new NextResponse(xlsxData, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="sample_import.xlsx"'
      }
    });
    
  } catch (error: any) {
    console.error('Error serving sample file:', error);
    return NextResponse.json(
      { error: 'Failed to serve sample file', details: error.message },
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