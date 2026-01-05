-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_admin boolean;
begin
  -- Check if the role is 'admin' logic (optional: or defined in metadata)
  -- For now, we trust the metadata 'role' but default to 'donor' if missing
  
  insert into public.profiles (user_id, full_name, phone, location)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'location'
  );

  insert into public.user_roles (user_id, role, approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'donor'),
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'admin' THEN true -- Auto-approve admins if created via valid flow
      ELSE false -- Others require approval
    END
  );

  -- Role specific tables
  IF (new.raw_user_meta_data->>'role') = 'ngo' THEN
    insert into public.ngos (user_id, organization_name)
    values (new.id, new.raw_user_meta_data->>'full_name');
  ELSIF (new.raw_user_meta_data->>'role') = 'volunteer' THEN
    insert into public.volunteers (user_id)
    values (new.id);
  END IF;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
