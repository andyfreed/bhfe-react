-- Create user_enrollments table to track which courses a user is enrolled in
CREATE TABLE IF NOT EXISTS user_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- Fields to track progress and completion
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  -- Fields for enrollment metadata
  enrolled_by UUID REFERENCES auth.users(id), -- The admin who enrolled the user, if applicable
  enrollment_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'purchase', etc.
  enrollment_notes TEXT,
  -- Timestamps
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Unique constraint to prevent duplicate enrollments
  UNIQUE(user_id, course_id)
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_course_id ON user_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_enrolled_by ON user_enrollments(enrolled_by);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_created_at ON user_enrollments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own enrollments
CREATE POLICY "Users can view their own enrollments" 
  ON user_enrollments
  FOR SELECT 
  USING (
    auth.uid() = user_id
  );

-- Create policy for admins to manage all enrollments
CREATE POLICY "Admins can manage all enrollments" 
  ON user_enrollments
  FOR ALL
  USING (
    auth.role() = 'authenticated'
  );

-- Create trigger function to update the updated_at field
CREATE OR REPLACE FUNCTION update_enrollment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_user_enrollments_updated_at
BEFORE UPDATE ON user_enrollments
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_updated_at(); 