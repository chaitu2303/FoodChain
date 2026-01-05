-- 1. Modify PROFILES table (use id, NOT user_id)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('admin', 'donor', 'volunteer', 'ngo')),
ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_login boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS mobile text;

-- 2. Fix RLS policies (using id)
DROP POLICY IF EXISTS "Profiles are viewable by owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;

CREATE POLICY "Profiles are viewable by owner and admin"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile details"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 3. Trigger Function (FIXED)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    mobile,
    latitude,
    longitude,
    role,
    approved,
    first_login
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'latitude')::double precision,
    (NEW.raw_user_meta_data->>'longitude')::double precision,
    COALESCE(NEW.raw_user_meta_data->>'role', 'donor'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN true
      ELSE false
    END,
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reattach Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();
