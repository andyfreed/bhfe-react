-- Create a function to execute SQL statements for migrations
-- This needs to be run once with admin privileges

-- Function to execute arbitrary SQL with admin privileges
-- This function should be used carefully and only by admin users

-- Create the function
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  is_admin boolean;
BEGIN
  -- Check if the user has admin privileges
  is_admin := (
    (SELECT current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role') OR
    (SELECT current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin') OR
    (SELECT current_setting('request.jwt.claims', true)::jsonb->>'role' = 'supabase_admin')
  );
  
  -- Deny access if not admin
  IF NOT is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied. Only admin users can execute arbitrary SQL.'
    );
  END IF;

  -- Execute the SQL and capture any errors
  BEGIN
    EXECUTE sql_query;
    result := jsonb_build_object(
      'success', true,
      'message', 'SQL executed successfully'
    );
  EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
  END;
  
  RETURN result;
END;
$$;

-- Set appropriate permissions
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM public;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

COMMENT ON FUNCTION public.exec_sql(text) IS 'Executes arbitrary SQL statements with admin privileges. Only available to admin users.'; 