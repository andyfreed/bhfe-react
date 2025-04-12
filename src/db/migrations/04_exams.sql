-- Create exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create exam questions table
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user exam attempts table
CREATE TABLE IF NOT EXISTS public.user_exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  score INTEGER,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  passed BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user exam answers table
CREATE TABLE IF NOT EXISTS public.user_exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.user_exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_user_id ON public.user_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_exam_id ON public.user_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_answers_attempt_id ON public.user_exam_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_answers_question_id ON public.user_exam_answers(question_id);

-- Create triggers for updating updated_at
CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_questions_updated_at
  BEFORE UPDATE ON public.exam_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_exam_attempts_updated_at
  BEFORE UPDATE ON public.user_exam_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_exam_answers_updated_at
  BEFORE UPDATE ON public.user_exam_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exam_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for exam access
CREATE POLICY "Users can view exams for enrolled courses"
  ON public.exams FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_enrollments
    WHERE user_id = auth.uid() AND course_id = exams.course_id
  ));

CREATE POLICY "Users can view questions for their attempts"
  ON public.exam_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_exam_attempts
    WHERE user_id = auth.uid() AND exam_id = exam_questions.exam_id
  ));

-- Create policies for exam attempts
CREATE POLICY "Users can view their own exam attempts"
  ON public.user_exam_attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create exam attempts"
  ON public.user_exam_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own exam attempts"
  ON public.user_exam_attempts FOR UPDATE
  USING (user_id = auth.uid());

-- Create policies for exam answers
CREATE POLICY "Users can view their own exam answers"
  ON public.user_exam_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_exam_attempts
    WHERE id = user_exam_answers.attempt_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create exam answers"
  ON public.user_exam_answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_exam_attempts
    WHERE id = attempt_id AND user_id = auth.uid()
  ));

-- Create policies for admin access
CREATE POLICY "Admins can manage all exams"
  ON public.exams FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage all exam questions"
  ON public.exam_questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can view all exam attempts"
  ON public.user_exam_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can view all exam answers"
  ON public.user_exam_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )); 