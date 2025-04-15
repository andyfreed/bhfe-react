import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a Supabase client with the service role key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // Path to the migration file
    const migrationFile = path.join(__dirname, 'migrations', '07_ensure_ea_otrp_credit_type.sql');
    
    // Read the migration file
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Execute the migration as a raw SQL query
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Migration failed:', error);
      return;
    }
    
    console.log('Migration successful!');
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration(); 