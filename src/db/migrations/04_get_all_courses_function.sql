-- Function to get all courses with their relations directly from SQL
-- This bypasses RLS policies entirely by using a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_all_courses_with_relations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This will execute with the privileges of the function creator
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH course_data AS (
    SELECT 
      c.id,
      c.title,
      c.description,
      c.sku,
      c.author,
      c.main_subject,
      c.created_at,
      c.updated_at,
      c.table_of_contents_url,
      c.course_content_url,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', cf.id,
            'course_id', cf.course_id,
            'format', cf.format,
            'price', cf.price,
            'created_at', cf.created_at,
            'updated_at', cf.updated_at
          )
        )
        FROM course_formats cf
        WHERE cf.course_id = c.id
      ) AS formats,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', cc.id,
            'course_id', cc.course_id,
            'credit_type', cc.credit_type,
            'amount', cc.amount,
            'course_number', cc.course_number
          )
        )
        FROM course_credits cc
        WHERE cc.course_id = c.id
      ) AS credits,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', cs.id,
            'course_id', cs.course_id,
            'state', cs.state
          )
        )
        FROM course_states cs
        WHERE cs.course_id = c.id
      ) AS states
    FROM courses c
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', cd.id,
      'title', cd.title,
      'description', cd.description,
      'sku', cd.sku,
      'author', cd.author,
      'main_subject', cd.main_subject,
      'created_at', cd.created_at,
      'updated_at', cd.updated_at,
      'table_of_contents_url', cd.table_of_contents_url,
      'course_content_url', cd.course_content_url,
      'formats', COALESCE(cd.formats, '[]'::jsonb),
      'credits', COALESCE(cd.credits, '[]'::jsonb),
      'states', COALESCE(cd.states, '[]'::jsonb)
    )
  )
  INTO result
  FROM course_data cd;
  
  -- If no courses found, return empty array
  IF result IS NULL THEN
    result := '[]'::jsonb;
  END IF;
  
  RETURN result;
END;
$$; 