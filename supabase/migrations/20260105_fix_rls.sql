-- 1. Create a Helper Function to Check Admin Status (Breaks Recursion)
-- SECURITY DEFINER means this runs with the permissions of the creator (postgres),
-- allowing it to read 'profiles' without triggering RLS recursively.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop Old Recursive Policies
DROP POLICY IF EXISTS "Profiles are viewable by owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 3. Create New Non-Recursive Policies

-- SELECT: Users can see their own profile OR Admins can see all
CREATE POLICY "Profiles are viewable by owner and admin"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  public.is_admin()
);

-- INSERT: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile OR Admins can update any
CREATE POLICY "Users can update own profile details"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id 
  OR 
  public.is_admin()
);

-- DELETE: Admins can delete users (Optional but good for Dashboard)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_admin());

-- 4. Grant Permissions (Fixes 'permission denied')
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
