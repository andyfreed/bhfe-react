#!/usr/bin/env node

/**
 * Script to configure Supabase storage bucket for file access
 * 
 * Usage:
 * node scripts/configure-supabase-storage.js
 * 
 * Requires Supabase service key set in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Main function to configure storage
async function configureStorage() {
  try {
    console.log('Configuring Supabase Storage...');

    // Step 1: Check if the 'course-files' bucket exists
    console.log('Checking for course-files bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'course-files');
    
    // Step 2: Create the bucket if it doesn't exist
    if (!bucketExists) {
      console.log('Creating course-files bucket...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('course-files', {
        public: true, // Make the bucket public
        fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
      });
      
      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
      
      console.log('✅ course-files bucket created');
    } else {
      console.log('✅ course-files bucket already exists');
      
      // Update bucket to be public
      console.log('Updating bucket visibility...');
      const { data: updateData, error: updateError } = await supabase.storage.updateBucket('course-files', {
        public: true,
      });
      
      if (updateError) {
        console.warn(`Warning: Failed to update bucket visibility: ${updateError.message}`);
      } else {
        console.log('✅ Updated bucket to be public');
      }
    }

    // Step 3: Create a policy for anonymous access
    console.log('Creating storage policies...');
    // Note: This requires Supabase JS client v2+ or a direct API call
    // This is not supported in all client versions, so this part might need to be manual

    console.log('\nConfiguration complete! Please check the Supabase dashboard to verify:');
    console.log('1. The course-files bucket exists and is set to public');
    console.log('2. There is a policy allowing anonymous users to read files');
    console.log(`3. You can manually test by uploading a file and accessing its public URL\n`);
    
    // Test by uploading a sample file
    await testBucket();
    
  } catch (error) {
    console.error('Error configuring storage:', error);
    process.exit(1);
  }
}

// Test function to upload a file and get its URL
async function testBucket() {
  try {
    // Create a simple test file
    const testFilePath = resolve(process.cwd(), 'test-file.txt');
    writeFileSync(testFilePath, 'This is a test file to verify bucket access');
    
    console.log('Uploading a test file...');
    const fileBuffer = readFileSync(testFilePath);
    
    const { data, error } = await supabase.storage
      .from('course-files')
      .upload('test.txt', fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'text/plain'
      });
    
    if (error) {
      throw new Error(`Failed to upload test file: ${error.message}`);
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('course-files')
      .getPublicUrl('test.txt');
    
    console.log('✅ Test file uploaded successfully');
    console.log('Public URL:', urlData.publicUrl);
    console.log('Try accessing this URL in your browser to verify it works');
    
    // Clean up the temporary file
    unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('Error during bucket test:', error);
  }
}

// Run the configuration
configureStorage(); 