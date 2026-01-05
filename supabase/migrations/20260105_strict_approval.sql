-- 1. Modify PROFILES table to include Role, Approval, Location, and First Login flags
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text check (role in ('admin', 'donor', 'volunteer', 'ngo')),
ADD COLUMN IF NOT EXISTS approved boolean default false,
ADD COLUMN IF NOT EXISTS first_login boolean default true,
ADD COLUMN IF NOT EXISTS latitude float,
ADD COLUMN IF NOT EXISTS longitude float,
ADD COLUMN IF NOT EXISTS mobile text; -- ensuring mobile field exists if distinct from phone, though usually same

-- 2. Update RLS on Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;

CREATE POLICY "Profiles are viewable by owner and admin" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile details" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Strict Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    phone, 
    mobile,
    location, 
    latitude, 
    longitude, 
    role, 
    approved, 
    first_login
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'phone', -- Map phone to mobile as well
    new.raw_user_meta_data->>'location',
    (new.raw_user_meta_data->>'latitude')::float,
    (new.raw_user_meta_data->>'longitude')::float,
    COALESCE(new.raw_user_meta_data->>'role', 'donor'),
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'admin' THEN true 
      ELSE false 
    END,
    true -- first_login default
  );

  -- Handle Role Specific Tables (Optional, but good for data integrity)
  IF (new.raw_user_meta_data->>'role') = 'ngo' THEN
    INSERT INTO public.ngos (user_id, organization_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
  ELSIF (new.raw_user_meta_data->>'role') = 'volunteer' THEN
    INSERT INTO public.volunteers (user_id)
    VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
