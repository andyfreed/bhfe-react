-- Create policy for anonymous users to insert new contact inquiries
-- This is needed for the public contact form to work without authentication
CREATE POLICY "Public users can submit contact inquiries" 
  ON contact_inquiries
  FOR INSERT 
  WITH CHECK (true);

-- Drop the requirement that only authenticated users can insert
DROP POLICY IF EXISTS "Admins can insert contact inquiries" ON contact_inquiries;

-- Replace with policy that admins can insert with more fields
CREATE POLICY "Admins can insert contact inquiries with notes" 
  ON contact_inquiries
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated'
  ); 