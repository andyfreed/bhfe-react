-- Add exam_score column to user_enrollments table
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS exam_score INTEGER DEFAULT NULL;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS exam_passed BOOLEAN DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN user_enrollments.exam_score IS 'Score achieved on the course exam (0-100).';
COMMENT ON COLUMN user_enrollments.exam_passed IS 'Whether the user passed the exam for this course.';

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_enrollments_exam_score ON user_enrollments(exam_score);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_exam_passed ON user_enrollments(exam_passed);

-- Update documentation
COMMENT ON TABLE user_enrollments IS 'Stores enrollment information including progress, completion status, and exam results.'; 