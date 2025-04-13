-- Function to disable problematic profile policies
CREATE OR REPLACE FUNCTION public.disable_profile_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable the problematic policy that causes infinite recursion
  ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
  
  -- We'll re-enable it after 5 minutes to ensure security isn't permanently compromised
  PERFORM pg_sleep(300);
  
  -- Re-enable RLS but with modified policies
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  
  -- Drop the problematic policies
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
  
  -- Create simplified policies that don't cause recursion
  CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);
    
  CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
    
  CREATE POLICY "Public profiles view access"
    ON public.profiles FOR SELECT
    USING (true);
END;
$$; 