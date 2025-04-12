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

-- Create trigger for updating updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
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