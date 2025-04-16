-- Migration to add image_url column to the courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add an index to improve query performance when filtering by image_url
CREATE INDEX IF NOT EXISTS idx_courses_image_url ON courses(image_url);

-- Comment about applying this migration
COMMENT ON COLUMN courses.image_url IS 'URL to the course image, used for display in course listings and detail pages'; 