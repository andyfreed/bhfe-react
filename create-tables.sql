-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users table (allow read access for all authenticated users)
CREATE POLICY "Allow read access to all users" 
    ON public.users 
    FOR SELECT 
    USING (true);

-- Create policy for users table (allow read/write access for admins)
CREATE POLICY "Allow full access to users for admins" 
    ON public.users 
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enrollment_type TEXT DEFAULT 'self',
    enrollment_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Enable Row Level Security for enrollments table
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create policy for enrollments table (allow read access for all authenticated users)
CREATE POLICY "Allow read access to all enrollments" 
    ON public.enrollments 
    FOR SELECT 
    USING (true);

-- Create policy for enrollments table (allow users to read their own enrollments)
CREATE POLICY "Allow users to read their own enrollments" 
    ON public.enrollments 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Create policy for enrollments table (allow full access for admins)
CREATE POLICY "Allow full access to enrollments for admins" 
    ON public.enrollments 
    USING (auth.jwt() ->> 'role' = 'admin');

-- Add some test users (for development only)
INSERT INTO public.users (email, name) VALUES
    ('test1@example.com', 'Test User 1'),
    ('test2@example.com', 'Test User 2'),
    ('admin@example.com', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Extract some existing course IDs for our test enrollments
WITH course_ids AS (
    SELECT id FROM public.courses LIMIT 2
)
-- Add some test enrollments (for development only)
INSERT INTO public.enrollments (user_id, course_id, progress, completed, enrollment_type)
SELECT 
    u.id,
    c.id,
    CASE WHEN u.email = 'test1@example.com' THEN 25 ELSE 100 END,
    CASE WHEN u.email = 'test1@example.com' THEN false ELSE true END,
    CASE WHEN u.email = 'test1@example.com' THEN 'self' ELSE 'admin' END
FROM 
    public.users u
CROSS JOIN 
    (SELECT id FROM public.courses LIMIT 2) c
WHERE 
    u.email IN ('test1@example.com', 'test2@example.com')
ON CONFLICT (user_id, course_id) DO NOTHING; 