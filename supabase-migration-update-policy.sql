-- Migration: Add missing UPDATE policy for user_exam_answers table
-- This policy allows users to update their own exam answers during an active attempt
-- Apply this to your Supabase database via the SQL Editor in the Supabase Dashboard

-- Add UPDATE policy for users to update their own exam answers
CREATE POLICY "Users can update their own exam answers"
  ON public.user_exam_answers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_exam_attempts
    WHERE id = user_exam_answers.attempt_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_exam_attempts
    WHERE id = attempt_id AND user_id = auth.uid()
  ));

-- Add UPDATE policy for admins to update all exam answers
CREATE POLICY "Admins can update all exam answers"
  ON public.user_exam_answers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Verify the policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_exam_answers' AND cmd = 'UPDATE'; 