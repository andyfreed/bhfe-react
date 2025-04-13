const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env file
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    console.log('Setting up database functions...');
    
    // Read SQL files from migrations directory
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    const sqlFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper execution order
    
    for (const file of sqlFiles) {
      console.log(`Executing ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute SQL statements
      const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
      
      if (error) {
        console.error(`Error executing ${file}:`, error);
      } else {
        console.log(`Successfully executed ${file}`);
      }
    }
    
    console.log('Database setup complete');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main(); 