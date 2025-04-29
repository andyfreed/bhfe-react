-- Add address street2 fields to profiles table

-- Add billing_street_2 and shipping_street_2 columns to profiles table
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS billing_street_2 text,
ADD COLUMN IF NOT EXISTS shipping_street_2 text;

-- Update RLS policies to include the new columns
BEGIN;
  -- Get the current policy text
  CREATE OR REPLACE FUNCTION update_policy_for_street2() RETURNS void AS $$
  DECLARE
    policy_text text;
    updated_policy_text text;
  BEGIN
    -- Update the policy for authenticated users if it exists
    SELECT pg_get_policydef(p.oid)
    INTO policy_text
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'profiles'
      AND p.polname = 'Profiles can be updated by the user that owns it.';
      
    IF policy_text IS NOT NULL THEN
      -- Clone the policy to include new fields
      ALTER POLICY "Profiles can be updated by the user that owns it." ON public.profiles
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    END IF;

    -- For other policies, repeat similar checks as needed
  END;
  $$ LANGUAGE plpgsql;

  -- Call the function
  SELECT update_policy_for_street2();

  -- Clean up
  DROP FUNCTION IF EXISTS update_policy_for_street2();
COMMIT; 