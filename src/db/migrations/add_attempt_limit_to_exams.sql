-- Add attempt_limit column to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS attempt_limit INTEGER DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN exams.attempt_limit IS 'Maximum number of attempts allowed for this exam. NULL means unlimited attempts.';

-- Create an index on the column for faster lookups
CREATE INDEX IF NOT EXISTS idx_exams_attempt_limit ON exams(attempt_limit);

-- Update documentation
COMMENT ON TABLE exams IS 'Stores exam information including title, description, passing score, and attempt limits.'; 