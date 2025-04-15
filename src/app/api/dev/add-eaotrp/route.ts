import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple SQL to add the enum value if it doesn't exist
const migrationSQL = `
-- Check if 'EA/OTRP' exists in the credit_type enum
DO $$
DECLARE
    exists_eaotrp BOOLEAN;
BEGIN
    -- Check if EA/OTRP exists in the enum
    SELECT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'EA/OTRP'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'credit_type')
    ) INTO exists_eaotrp;

    -- If EA/OTRP doesn't exist, add it to the enum
    IF NOT exists_eaotrp THEN
        -- Create a new enum type with the additional value
        CREATE TYPE credit_type_new AS ENUM ('CPA', 'CFP', 'CDFA', 'EA', 'OTRP', 'ERPA', 'EA/OTRP');

        -- Update the course_credits table to use the new enum
        ALTER TABLE public.course_credits 
            ALTER COLUMN credit_type TYPE credit_type_new 
            USING credit_type::text::credit_type_new;

        -- Update the subject_areas table to use the new enum
        ALTER TABLE public.subject_areas 
            ALTER COLUMN credit_type TYPE credit_type_new 
            USING (CASE WHEN credit_type IS NULL THEN NULL ELSE credit_type::text::credit_type_new END);

        -- Drop the old enum
        DROP TYPE credit_type;

        -- Rename the new enum to the old name
        ALTER TYPE credit_type_new RENAME TO credit_type;
        
        RAISE NOTICE 'Added EA/OTRP to credit_type enum';
    ELSE
        RAISE NOTICE 'EA/OTRP already exists in credit_type enum';
    END IF;
END
$$;
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
    console.log('Running SQL migration to add EA/OTRP to credit_type enum');
    
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
      message: 'Successfully added EA/OTRP to credit_type enum'
    });
  } catch (error) {
    console.error('Error running migration:', error);
    return NextResponse.json(
      { error: 'Failed to run migration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 