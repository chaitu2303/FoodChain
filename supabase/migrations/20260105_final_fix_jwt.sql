-- 1. Grant Base Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 2. Create JWT-Based Admin Check (ZERO RECURSION)
-- Instead of querying the database (which causes loops/errors), we check the Token directly.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Checks the 'role' field in the user_metadata JSON of the JWT
  -- This is extremely fast and cannot cause permission errors
  RETURN (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reset Profiles Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 4. Apply Robust Policies
CREATE POLICY "Profiles are viewable by owner and admin"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR
  public.is_admin()
);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile details"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id
  OR
  public.is_admin()
);

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.is_admin());

-- 5. Fix user_roles (Cleanup)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public roles are viewable by everyone" ON public.user_roles;
        DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
        DROP POLICY IF EXISTS "Admins can update approval status" ON public.user_roles;
        DROP POLICY IF EXISTS "Admins can update user_roles" ON public.user_roles;
        CREATE POLICY "Admins can update user_roles" ON public.user_roles FOR ALL USING (public.is_admin());
    END IF;
END $$;
