-- RESILIENT TRIGGER: Catches errors so Registration never fails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap logic in a block to catch errors
  BEGIN
    INSERT INTO public.profiles (
      id,
      user_id,
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
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      (NEW.raw_user_meta_data->>'latitude')::double precision,
      (NEW.raw_user_meta_data->>'longitude')::double precision,
      COALESCE(NEW.raw_user_meta_data->>'role', 'donor'),
      CASE 
        WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN true 
        ELSE false 
      END,
      true
    )
    ON CONFLICT (user_id) DO NOTHING; -- Avoid duplicate error

  EXCEPTION WHEN OTHERS THEN
    -- If trigger fails, LOG it but DO NOT BLOCK registration
    RAISE WARNING 'Profile creation failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure Trigger is Active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();
