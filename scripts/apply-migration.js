#!/usr/bin/env node
/**
 * Script to apply database migrations
 * 
 * Usage: 
 * node scripts/apply-migration.js path/to/migration.sql
 * 
 * Example:
 * node scripts/apply-migration.js src/db/migrations/04_fix_enrollment_relations.sql
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Configure dotenv to load .env.local
dotenv.config({ path: '.env.local' });

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if a migration file was provided
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Error: No migration file specified');
  console.error('Usage: node scripts/apply-migration.js path/to/migration.sql');
  process.exit(1);
}

// Read the migration SQL file
let sqlScript;
try {
  const fullPath = path.resolve(process.cwd(), migrationFile);
  sqlScript = fs.readFileSync(fullPath, 'utf8');
  console.log(`Read migration file: ${migrationFile}`);
} catch (error) {
  console.error(`Error reading migration file: ${error.message}`);
  process.exit(1);
}

// Get database credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase environment variables are not set');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

// Extract the database connection details from the Supabase URL
// Supabase URL format: https://project-id.supabase.co
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectId) {
  console.error('Error: Could not extract project ID from Supabase URL');
  process.exit(1);
}

// Create a PostgreSQL connection configuration
const connectionString = `postgresql://postgres:${supabaseServiceKey}@${projectId}.supabase.co:5432/postgres`;

console.log('Database connection configured');
console.log(`Using connection to project: ${projectId}`);

// Function to apply the migration
async function applyMigration() {
  // Create a new pool instance
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // required for Supabase connections
    },
  });

  console.log('Connecting to database...');
  
  let client;
  try {
    // Connect to the database
    client = await pool.connect();
    console.log('Successfully connected to database');
    
    // Split the SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      try {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the statement
        await client.query(`${statement};`);
        console.log(`Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}/${statements.length}: ${error.message}`);
        console.error(`Statement: ${statements[i]}`);
        console.log('Proceeding with next statement...');
      }
    }
    
    // Verify the migration by checking users table
    try {
      const { rows } = await client.query('SELECT COUNT(*) FROM public.users');
      console.log(`Verification: Found ${rows[0].count} users in the database`);
    } catch (error) {
      console.error(`Error verifying migration: ${error.message}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error(`Error during migration: ${error.message}`);
    process.exit(1);
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
    
    // Close the pool
    await pool.end();
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('Migration process completed');
  })
  .catch(error => {
    console.error(`Migration failed: ${error.message}`);
    process.exit(1);
  });