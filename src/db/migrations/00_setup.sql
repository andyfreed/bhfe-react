-- Master setup file that runs all migrations in order
-- This file should be run first when setting up a new database

-- Run migrations in order
\i src/db/migrations/01_auth_and_profiles.sql
\i src/db/migrations/02_courses.sql
\i src/db/migrations/03_enrollments.sql
\i src/db/migrations/04_exams.sql
\i src/db/migrations/05_contact_inquiries.sql

-- Create initial admin user
-- Replace these values with your desired admin credentials
DO $$ 
DECLARE 
  admin_id uuid;
BEGIN
  -- Create admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('change-this-password', gen_salt('bf')),
    now(),
    now(),
    now()
  ) RETURNING id INTO admin_id;

  -- Set admin role in profiles
  -- The trigger will create the profile, we just need to update it
  UPDATE profiles
  SET role = 'admin'
  WHERE id = admin_id;
END $$; 