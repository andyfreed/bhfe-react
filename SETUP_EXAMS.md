# Setting Up Exams Functionality

To enable the exams functionality in the Bunnell Helfrich Financial Education platform, you'll need to create the necessary database tables in Supabase.

## Required Tables

The exams functionality requires the following tables:
- `exams`: Stores the exam metadata
- `exam_questions`: Stores questions for each exam
- `user_exam_attempts`: Tracks user attempts at exams
- `user_exam_answers`: Stores user answers for each question

## Setup Instructions

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `src/sql/create_exam_tables.sql` into the editor
5. Run the SQL query to create all the necessary tables

## Schema Overview

### Exams Table
- `id`: Unique identifier for the exam
- `course_id`: Foreign key to the associated course
- `title`: Title of the exam
- `description`: Description of the exam
- `passing_score`: Percentage needed to pass (e.g., 70)
- `created_at`: Timestamp when the exam was created

### Exam Questions Table
- `id`: Unique identifier for the question
- `exam_id`: Foreign key to the associated exam
- `question_text`: The question text
- `option_a`, `option_b`, `option_c`, `option_d`: The four possible answers
- `correct_option`: Which option (a, b, c, or d) is correct
- `created_at`: Timestamp when the question was created

### User Exam Attempts Table
- `id`: Unique identifier for the attempt
- `user_id`: Foreign key to the user
- `exam_id`: Foreign key to the exam
- `score`: The user's score (null until completed)
- `completed`: Whether the attempt has been completed
- `started_at`: When the attempt was started
- `completed_at`: When the attempt was completed (null until completed)
- `passed`: Whether the user passed the exam (null until completed)
- `created_at`: Timestamp when the attempt was created

### User Exam Answers Table
- `id`: Unique identifier for the answer
- `attempt_id`: Foreign key to the attempt
- `question_id`: Foreign key to the question
- `selected_option`: Which option (a, b, c, or d) the user selected
- `created_at`: Timestamp when the answer was saved

## Troubleshooting

If you encounter the error `relation "public.exams" does not exist`, it means the tables have not been created in your Supabase database. Follow the setup instructions above to create the necessary tables.

## Security

The exams API endpoints use the following authentication mechanisms:
- Admin endpoints require an admin_token cookie
- User endpoints require a user_token cookie

Make sure these authentication mechanisms are properly set up in your environment. 