import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// SQL migration to add exam_score and exam_passed to user_enrollments
const migrationSQL = `
-- Add exam_score column to user_enrollments table
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS exam_score INTEGER DEFAULT NULL;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS exam_passed BOOLEAN DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN user_enrollments.exam_score IS 'Score achieved on the course exam (0-100).';
COMMENT ON COLUMN user_enrollments.exam_passed IS 'Whether the user passed the exam for this course.';

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_enrollments_exam_score ON user_enrollments(exam_score);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_exam_passed ON user_enrollments(exam_passed);

-- Update documentation
COMMENT ON TABLE user_enrollments IS 'Stores enrollment information including progress, completion status, and exam results.';
`;

export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }
  
  try {
    console.log('Running SQL migration to add exam_score and exam_passed to user_enrollments');
    
    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAdminKey);
    
    // Execute the SQL migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('Migration successful!');
    
    return NextResponse.json({
      success: true,
      message: 'Successfully added exam_score and exam_passed columns to user_enrollments'
    });
  } catch (error) {
    console.error('Error running migration:', error);
    return NextResponse.json(
      { error: 'Failed to run migration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 