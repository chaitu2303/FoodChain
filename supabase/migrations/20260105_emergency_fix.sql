-- EMERGENCY FIX: Unblock All Access to Debug
-- This removes strict RLS policies and resets permissions to a permissive state 
-- so you can see if the app works.

-- 1. Grant Access to 'auth.users' (Fixes "permission denied for table users")
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- 2. RESET & OPEN PROFILES
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop EVERYTHING
DROP POLICY IF EXISTS "Profiles are viewable by owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow All Authenticated" ON public.profiles;

-- Create ONE simple Policy: "If you are logged in, you can see/edit everything"
CREATE POLICY "Allow All Authenticated"
ON public.profiles
FOR ALL
USING (auth.role() = 'authenticated');

-- 3. Ensure Public Schema is Accessible
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
