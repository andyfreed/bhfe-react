-- Script to create or update an admin user in Supabase
-- Run this in your Supabase SQL editor

-- First, create a user through Supabase Auth Dashboard or use an existing user
-- Then run this to make them an admin:

-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, role 
FROM profiles 
WHERE email = 'your-email@example.com'; 