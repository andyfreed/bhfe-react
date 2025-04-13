-- Function to execute SQL statements
-- This is a helper function for our setup script
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Execute with the privileges of the function creator
AS $$
BEGIN
  EXECUTE sql;
END;
$$; 