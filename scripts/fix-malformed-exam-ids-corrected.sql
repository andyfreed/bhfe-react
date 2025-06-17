-- Corrected script to find and fix malformed exam IDs
-- The id column is UUID type, so we need to cast it to text for pattern matching

-- Find exams with the specific malformed ID or similar pattern
SELECT id::text, title, course_id 
FROM exams 
WHERE id::text LIKE '39d14c1f%'
   OR id::text = '39d14c1f--cd04dfea';

-- Check if there are any non-standard UUID formats in the exams table
SELECT id::text, title 
FROM exams 
WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- If you find the malformed exam, here's how to fix it:

-- Option 1: Generate a completely new UUID
UPDATE exams 
SET id = gen_random_uuid()
WHERE id::text = '39d14c1f--cd04dfea'
RETURNING id, title;

-- Option 2: If the exam doesn't exist but is referenced somewhere, 
-- you might need to create it with a proper UUID:
-- INSERT INTO exams (id, title, course_id, description, passing_score, time_limit, attempt_limit)
-- VALUES (
--   gen_random_uuid(),
--   '1040 Workshop Exam',
--   'b7e21fa4-a789-40ed-9fdc-8c5081dd0182',
--   'Exam for 1040 Workshop',
--   70,
--   60,
--   3
-- );

-- Check for orphaned exam attempts with the malformed ID
SELECT * FROM user_exam_attempts 
WHERE exam_id::text = '39d14c1f--cd04dfea';

-- Check for orphaned exam questions with the malformed ID
SELECT * FROM exam_questions 
WHERE exam_id::text = '39d14c1f--cd04dfea'; 