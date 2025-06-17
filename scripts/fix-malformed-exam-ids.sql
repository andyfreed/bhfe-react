-- Script to find and fix malformed exam IDs in the database
-- Run this in your Supabase SQL editor

-- First, let's identify any exams with malformed IDs
SELECT id, title, course_id 
FROM exams 
WHERE id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- If you find any malformed IDs, you can update them with proper UUIDs
-- For example, if you have an exam with ID '39d14c1f--cd04dfea', you can fix it:

-- Option 1: Generate a new UUID for the exam
-- UPDATE exams 
-- SET id = gen_random_uuid()
-- WHERE id = '39d14c1f--cd04dfea';

-- Option 2: Try to fix the malformed ID (if it's just a formatting issue)
-- UPDATE exams 
-- SET id = '39d14c1f-0000-0000-0000-cd04dfea0000'
-- WHERE id = '39d14c1f--cd04dfea';

-- Option 3: If the exam ID appears to be truncated, check the full data
-- SELECT * FROM exams WHERE id LIKE '39d14c1f%';

-- IMPORTANT: If you update exam IDs, you'll also need to update related tables:
-- 1. user_exam_attempts
-- 2. exam_questions
-- 3. user_exam_answers

-- To fix related records after updating an exam ID:
-- UPDATE user_exam_attempts SET exam_id = 'new-uuid' WHERE exam_id = 'old-malformed-id';
-- UPDATE exam_questions SET exam_id = 'new-uuid' WHERE exam_id = 'old-malformed-id';
-- UPDATE user_exam_answers SET exam_id = 'new-uuid' WHERE exam_id = 'old-malformed-id'; 