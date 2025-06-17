# Fix for Malformed Exam ID Issue

## Problem
You're seeing an error "Failed to load attempts" because the exam ID in your database is malformed. The ID `39d14c1f--cd04dfea` has two dashes instead of the proper UUID format.

## Immediate Steps to Fix

### 1. Check Your Exam Data
Visit this URL in your browser (after deployment):
```
https://your-site.vercel.app/api/debug/check-exam?courseId=b7e21fa4-a789-40ed-9fdc-8c5081dd0182
```

This will show you all exams for this course and identify any with malformed IDs.

### 2. Fix in Supabase
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run this query to find the malformed exam:

```sql
SELECT id, title, course_id 
FROM exams 
WHERE id = '39d14c1f--cd04dfea'
OR id LIKE '39d14c1f%';
```

### 3. Update the Exam ID
Once you've identified the exam, you have two options:

#### Option A: Generate a completely new UUID
```sql
-- First, store the old ID for reference
-- Then update with a new UUID
UPDATE exams 
SET id = gen_random_uuid()
WHERE id = '39d14c1f--cd04dfea'
RETURNING id, title;
```

#### Option B: Fix the malformed ID (if you want to preserve part of it)
```sql
-- Convert the malformed ID to a valid UUID format
UPDATE exams 
SET id = '39d14c1f-0cd0-4dfe-a000-000000000000'
WHERE id = '39d14c1f--cd04dfea'
RETURNING id, title;
```

### 4. Update Related Tables
After changing the exam ID, update any related records:

```sql
-- Update exam questions (if any)
UPDATE exam_questions 
SET exam_id = 'your-new-uuid-here'
WHERE exam_id = '39d14c1f--cd04dfea';

-- Update user attempts (if any)
UPDATE user_exam_attempts 
SET exam_id = 'your-new-uuid-here'
WHERE exam_id = '39d14c1f--cd04dfea';

-- Update user answers (if any)
UPDATE user_exam_answers 
SET exam_id = 'your-new-uuid-here'
WHERE exam_id = '39d14c1f--cd04dfea';
```

## Prevention
The code has been updated to validate exam IDs before making API calls, so this error will be caught earlier and provide a clearer message.

## Alternative: Re-import the Exam
If the exam data is corrupted beyond just the ID, you might want to delete and re-import it through the admin panel. 