-- 1. Modify PROFILES table to include Role and Approval
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text check (role in ('admin', 'donor', 'volunteer', 'ngo')),
ADD COLUMN IF NOT EXISTS approved boolean default false;

-- 2. Update RLS on Profiles to allow Admin full access and Users to read own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

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
  INSERT INTO public.profiles (user_id, full_name, phone, location, role, approved)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'location',
    COALESCE(new.raw_user_meta_data->>'role', 'donor'),
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'admin' THEN true 
      ELSE false 
    END
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

-- 4. Re-attach Trigger (just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
