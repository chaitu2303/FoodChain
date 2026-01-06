-- FIX TRIGGER: Populate user_id to satisfy NOT NULL constraint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,        -- Primary Key (We set this to User ID for easy lookup)
    user_id,   -- Foreign Key (Legacy column, must be Not Null)
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
    NEW.id,    -- id = Auth User ID
    NEW.id,    -- user_id = Auth User ID (Redundant but required by schema)
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
