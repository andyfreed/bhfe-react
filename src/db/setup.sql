-- Drop policies first
DROP POLICY IF EXISTS "Users can view questions for their attempts" ON public.exam_questions;
DROP POLICY IF EXISTS "Users can view their own exam attempts" ON public.user_exam_attempts;
DROP POLICY IF EXISTS "Users can create exam attempts" ON public.user_exam_attempts;
DROP POLICY IF EXISTS "Users can update their own exam attempts" ON public.user_exam_attempts;
DROP POLICY IF EXISTS "Users can view their own exam answers" ON public.user_exam_answers;
DROP POLICY IF EXISTS "Users can create exam answers" ON public.user_exam_answers;
DROP POLICY IF EXISTS "Admins can manage all exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can manage all exam questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Admins can view all exam attempts" ON public.user_exam_attempts;
DROP POLICY IF EXISTS "Admins can view all exam answers" ON public.user_exam_answers;
DROP POLICY IF EXISTS "Users can view exams for enrolled courses" ON public.exams;

DROP POLICY IF EXISTS "Public users can submit contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Admins can view all contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Admins can update contact inquiries" ON public.contact_inquiries;

DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.user_enrollments;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.user_enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.user_enrollments;

DROP POLICY IF EXISTS "Allow public read access" ON public.courses;
DROP POLICY IF EXISTS "Allow public read access" ON public.course_formats;
DROP POLICY IF EXISTS "Allow public read access" ON public.course_credits;
DROP POLICY IF EXISTS "Allow public read access" ON public.course_states;
DROP POLICY IF EXISTS "Allow public read access" ON public.subject_areas;
DROP POLICY IF EXISTS "Allow public read access" ON public.course_subject_areas;

DROP POLICY IF EXISTS "Allow admin full access" ON public.courses;
DROP POLICY IF EXISTS "Allow admin full access" ON public.course_formats;
DROP POLICY IF EXISTS "Allow admin full access" ON public.course_credits;
DROP POLICY IF EXISTS "Allow admin full access" ON public.course_states;
DROP POLICY IF EXISTS "Allow admin full access" ON public.subject_areas;
DROP POLICY IF EXISTS "Allow admin full access" ON public.course_subject_areas;

-- Drop triggers
DROP TRIGGER IF EXISTS update_user_exam_answers_updated_at ON public.user_exam_answers;
DROP TRIGGER IF EXISTS update_user_exam_attempts_updated_at ON public.user_exam_attempts;
DROP TRIGGER IF EXISTS update_exam_questions_updated_at ON public.exam_questions;
DROP TRIGGER IF EXISTS update_exams_updated_at ON public.exams;
DROP TRIGGER IF EXISTS update_contact_inquiries_updated_at ON public.contact_inquiries;
DROP TRIGGER IF EXISTS update_user_enrollments_updated_at ON public.user_enrollments;
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;

-- Drop everything in the correct order
DROP TABLE IF EXISTS public.user_exam_answers;
DROP TABLE IF EXISTS public.user_exam_attempts;
DROP TABLE IF EXISTS public.exam_questions;
DROP TABLE IF EXISTS public.exams;
DROP TABLE IF EXISTS public.contact_inquiries;
DROP TABLE IF EXISTS public.user_enrollments;
DROP TABLE IF EXISTS public.course_subject_areas;
DROP TABLE IF EXISTS public.subject_areas;
DROP TABLE IF EXISTS public.course_states;
DROP TABLE IF EXISTS public.course_credits;
DROP TABLE IF EXISTS public.course_formats;
DROP TABLE IF EXISTS public.courses;

-- Drop types after their dependent tables
DROP TYPE IF EXISTS course_format;
DROP TYPE IF EXISTS credit_type;
DROP TYPE IF EXISTS inquiry_status;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

------ AUTH AND PROFILES ------
-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'user',
  full_name TEXT,
  company TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing profiles updated_at trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create policies for profiles table
CREATE POLICY "Public can view own profile"
  ON public.profiles FOR SELECT
  USING (true);  -- Temporarily allow all reads for debugging

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

------ COURSES ------
-- Drop existing enum types if they exist
DROP TYPE IF EXISTS course_format;
DROP TYPE IF EXISTS credit_type;
DROP TYPE IF EXISTS inquiry_status;

-- Create enum types
CREATE TYPE course_format AS ENUM ('online', 'hardcopy', 'video');
CREATE TYPE credit_type AS ENUM ('CPA', 'CFP', 'CDFA', 'EA', 'OTRP', 'ERPA');

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  main_subject VARCHAR(255),
  author VARCHAR(255),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  table_of_contents_url TEXT,
  course_content_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create course formats table
CREATE TABLE IF NOT EXISTS public.course_formats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  format course_format NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  shipping_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, format)
);

-- Create course credits table
CREATE TABLE IF NOT EXISTS public.course_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  credit_type credit_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  course_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, credit_type)
);

-- Create course states table
CREATE TABLE IF NOT EXISTS public.course_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  state_code CHAR(2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, state_code)
);

-- Create subject areas table
CREATE TABLE IF NOT EXISTS public.subject_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  credit_type credit_type,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, credit_type)
);

-- Create course subject areas table
CREATE TABLE IF NOT EXISTS public.course_subject_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  subject_area_id UUID REFERENCES subject_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, subject_area_id)
);

-- Create trigger for updating courses updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for course tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_subject_areas ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON course_formats FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON course_credits FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON course_states FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON subject_areas FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON course_subject_areas FOR SELECT USING (true);

-- Create policies for admin access
CREATE POLICY "Allow admin full access" ON courses FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin full access" ON course_formats FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin full access" ON course_credits FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin full access" ON course_states FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin full access" ON subject_areas FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin full access" ON course_subject_areas FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

------ ENROLLMENTS ------
-- Create user_enrollments table
CREATE TABLE IF NOT EXISTS public.user_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  enrolled_by UUID REFERENCES auth.users(id),
  enrollment_type VARCHAR(50) DEFAULT 'manual',
  enrollment_notes TEXT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create indices for enrollments
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_course_id ON user_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_enrolled_by ON user_enrollments(enrolled_by);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_created_at ON user_enrollments(created_at);

-- Create trigger for updating enrollments updated_at
CREATE TRIGGER update_user_enrollments_updated_at
  BEFORE UPDATE ON user_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for user enrollments
CREATE POLICY "Users can view their own enrollments"
  ON user_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_enrollments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    (
      CASE WHEN user_id IS NOT NULL THEN user_id = auth.uid() ELSE true END AND
      CASE WHEN course_id IS NOT NULL THEN course_id = user_enrollments.course_id ELSE true END AND
      CASE WHEN enrolled_by IS NOT NULL THEN enrolled_by = user_enrollments.enrolled_by ELSE true END AND
      CASE WHEN enrollment_type IS NOT NULL THEN enrollment_type = user_enrollments.enrollment_type ELSE true END
    )
  );

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

------ EXAMS ------
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

-- Create indices for exams
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_user_id ON public.user_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_exam_id ON public.user_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_answers_attempt_id ON public.user_exam_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_answers_question_id ON public.user_exam_answers(question_id);

-- Create triggers for updating exam tables updated_at
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

-- Enable Row Level Security for exam tables
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

CREATE POLICY "Users can view their own exam attempts"
  ON public.user_exam_attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create exam attempts"
  ON public.user_exam_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own exam attempts"
  ON public.user_exam_attempts FOR UPDATE
  USING (user_id = auth.uid());

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

-- Create policies for admin exam access
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

------ CONTACT INQUIRIES ------
-- Create enum for inquiry status
CREATE TYPE inquiry_status AS ENUM ('new', 'in_progress', 'responded', 'closed', 'spam');

-- Create contact_inquiries table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status inquiry_status NOT NULL DEFAULT 'new',
  notes TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indices for contact inquiries
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);

-- Create trigger for updating contact inquiries updated_at
CREATE TRIGGER update_contact_inquiries_updated_at
  BEFORE UPDATE ON contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policy for public submissions
CREATE POLICY "Public users can submit contact inquiries"
  ON contact_inquiries FOR INSERT
  WITH CHECK (
    status = 'new' AND
    notes IS NULL AND
    responded_at IS NULL
  );

-- Create policies for admin access
CREATE POLICY "Admins can view all contact inquiries"
  ON contact_inquiries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update contact inquiries"
  ON contact_inquiries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Set your existing user as admin
UPDATE profiles
SET role = 'admin'
WHERE id = '59152c41-62dd-483f-a4ab-28d8bf44b219';

-- Set up email auth
-- Note: You'll need to configure these settings in your Supabase dashboard
-- 1. Go to Authentication > Providers
-- 2. Enable Email provider
-- 3. Configure email templates in Authentication > Email Templates

-- Additional security settings to consider:
-- 1. Set minimum password length
-- 2. Configure password strength requirements
-- 3. Set up rate limiting
-- 4. Configure session handling

-- You can configure these in the Supabase dashboard under:
-- Authentication > Policies 