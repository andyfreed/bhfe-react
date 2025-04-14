-- First, create a new enum type with the additional value
CREATE TYPE credit_type_new AS ENUM ('CPA', 'CFP', 'CDFA', 'EA', 'OTRP', 'ERPA', 'EA/OTRP');

-- Update the course_credits table to use the new enum
ALTER TABLE public.course_credits 
  ALTER COLUMN credit_type TYPE credit_type_new 
  USING credit_type::text::credit_type_new;

-- Update the subject_areas table to use the new enum
ALTER TABLE public.subject_areas 
  ALTER COLUMN credit_type TYPE credit_type_new 
  USING (CASE WHEN credit_type IS NULL THEN NULL ELSE credit_type::text::credit_type_new END);

-- Drop the old enum
DROP TYPE credit_type;

-- Rename the new enum to the old name
ALTER TYPE credit_type_new RENAME TO credit_type; 