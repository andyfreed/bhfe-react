-- Create enum for inquiry status
CREATE TYPE inquiry_status AS ENUM ('new', 'in_progress', 'responded', 'closed', 'spam');

-- Create contact_inquiries table
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status inquiry_status NOT NULL DEFAULT 'new',
  notes TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);

-- Set up Row Level Security (RLS)
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to see all inquiries
CREATE POLICY "Admins can see all contact inquiries" 
  ON contact_inquiries
  FOR SELECT 
  USING (
    auth.role() = 'authenticated'
  );

-- Create policy for admin users to insert new inquiries
CREATE POLICY "Admins can insert contact inquiries" 
  ON contact_inquiries
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Create policy for admin users to update inquiries
CREATE POLICY "Admins can update contact inquiries" 
  ON contact_inquiries
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated'
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_inquiries_updated_at
BEFORE UPDATE ON contact_inquiries
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 