import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAuth();
    
    console.log('Running SQL migration to add EA/OTRP to credit_type enum');
    
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
  } catch (error: any) {
    console.error('Error running migration:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 