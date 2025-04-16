-- Migration: Fix enrollment relations
-- This migration addresses the relationship between user_enrollments and users tables
-- by adding the proper foreign key constraint and ensuring users exist in public.users.

-- Temporarily disable foreign key checking to avoid constraint errors
SET session_replication_role = 'replica';

-- Create function to keep public.users in sync with auth.users
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a corresponding record in public.users if it doesn't exist
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to avoid errors when rerunning the migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically sync users from auth.users to public.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_user_to_public();

-- Sync existing users from auth.users to public.users if they don't already exist
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Fix foreign key constraints on user_enrollments
ALTER TABLE IF EXISTS public.user_enrollments
  DROP CONSTRAINT IF EXISTS user_enrollments_user_id_fkey;

ALTER TABLE IF EXISTS public.user_enrollments
  ADD CONSTRAINT user_enrollments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Add indexes to improve lookup performance
CREATE INDEX IF NOT EXISTS user_enrollments_user_id_idx
  ON public.user_enrollments(user_id);

CREATE INDEX IF NOT EXISTS users_id_idx
  ON public.users(id);

-- Re-enable foreign key checking
SET session_replication_role = 'origin'; 