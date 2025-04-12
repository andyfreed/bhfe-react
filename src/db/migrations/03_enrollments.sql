-- Create user_enrollments table
CREATE TABLE IF NOT EXISTS public.user_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- Fields to track progress and completion
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  -- Fields for enrollment metadata
  enrolled_by UUID REFERENCES auth.users(id),
  enrollment_type VARCHAR(50) DEFAULT 'manual',
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

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_enrollments_updated_at
  BEFORE UPDATE ON user_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for user enrollments
CREATE POLICY "Users can view their own enrollments"
  ON user_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own progress
CREATE POLICY "Users can update their own progress"
  ON user_enrollments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Only allow updating progress-related fields
    (
      CASE WHEN user_id IS NOT NULL THEN user_id = auth.uid() ELSE true END AND
      CASE WHEN course_id IS NOT NULL THEN course_id = user_enrollments.course_id ELSE true END AND
      CASE WHEN enrolled_by IS NOT NULL THEN enrolled_by = user_enrollments.enrolled_by ELSE true END AND
      CASE WHEN enrollment_type IS NOT NULL THEN enrollment_type = user_enrollments.enrollment_type ELSE true END
    )
  );

-- Create policies for admin access
CREATE POLICY "Admins can view all enrollments"
  ON user_enrollments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage all enrollments"
  ON user_enrollments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )); 