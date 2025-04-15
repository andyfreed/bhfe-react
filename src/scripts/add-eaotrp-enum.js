// Run direct Supabase SQL to add EA/OTRP enum value
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase connection setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key is missing. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple SQL to add the enum value if it doesn't exist
const sql = `
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

async function runMigration() {
  try {
    console.log('Starting SQL migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration successful!');
    console.log('The EA/OTRP credit type has been added to the database.');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration(); 