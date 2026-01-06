-- 1. Grant Permissions (Broad Fix)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 2. Clean Slate for Profiles Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- DROP ALL KNOWN VARIANTS OF POLICIES (From full_schema, strict_approval, and fix_rls)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 3. Re-Create Clean Policies (Non-Recursive)

-- READ (Safe Admin Check)
CREATE POLICY "Profiles are viewable by owner and admin"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR
  public.is_admin()
);

-- INSERT
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE (Safe Admin Check)
CREATE POLICY "Users can update own profile details"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id
  OR
  public.is_admin()
);

-- DELETE (Hard Admin Only)
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.is_admin());

-- 4. Clean user_roles (Just in case it exists and interferes)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public roles are viewable by everyone" ON public.user_roles;
        DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
        DROP POLICY IF EXISTS "Admins can update approval status" ON public.user_roles;
        DROP POLICY IF EXISTS "Admins can update user_roles" ON public.user_roles;
        
        -- Simple Admin Overwrite
        CREATE POLICY "Admins can update user_roles" ON public.user_roles FOR ALL USING (public.is_admin());
    END IF;
END $$;
