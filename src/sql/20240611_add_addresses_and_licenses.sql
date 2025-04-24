-- Migration: add first/last name, addresses, and user_licenses table

-- Add columns to profiles table if they don't exist
DO $$
BEGIN
    -- first / last name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='first_name') THEN
        ALTER TABLE profiles ADD COLUMN first_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='last_name') THEN
        ALTER TABLE profiles ADD COLUMN last_name text;
    END IF;

    -- billing address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='billing_street') THEN
        ALTER TABLE profiles ADD COLUMN billing_street text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='billing_city') THEN
        ALTER TABLE profiles ADD COLUMN billing_city text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='billing_state') THEN
        ALTER TABLE profiles ADD COLUMN billing_state text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='billing_zip') THEN
        ALTER TABLE profiles ADD COLUMN billing_zip text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='billing_country') THEN
        ALTER TABLE profiles ADD COLUMN billing_country text;
    END IF;

    -- shipping address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='shipping_street') THEN
        ALTER TABLE profiles ADD COLUMN shipping_street text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='shipping_city') THEN
        ALTER TABLE profiles ADD COLUMN shipping_city text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='shipping_state') THEN
        ALTER TABLE profiles ADD COLUMN shipping_state text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='shipping_zip') THEN
        ALTER TABLE profiles ADD COLUMN shipping_zip text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='shipping_country') THEN
        ALTER TABLE profiles ADD COLUMN shipping_country text;
    END IF;
END $$;

-- Create user_licenses table
CREATE TABLE IF NOT EXISTS user_licenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    license_type text NOT NULL,
    license_number text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Optional: index for quick look-ups by user
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON user_licenses(user_id); 