-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USER ROLES (Auth & Access)
create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null unique,
  role text not null check (role in ('admin', 'donor', 'volunteer', 'ngo')),
  approved boolean default false, -- Admin must approve access
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Policies for user_roles
create policy "Public roles are viewable by everyone" 
on public.user_roles for select using (true);

create policy "Users can insert their own role" 
on public.user_roles for insert with check (auth.uid() = user_id);

create policy "Admins can update approval status" 
on public.user_roles for update using (
  exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() and role = 'admin'
  )
);

-- 2. PROFILES (General Info)
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null unique,
  full_name text,
  phone text,
  location text,
  updated_at timestamp with time zone
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
on public.profiles for select using (true);

create policy "Users can insert their own profile" 
on public.profiles for insert with check (auth.uid() = user_id);

create policy "Users can update own profile" 
on public.profiles for update using (auth.uid() = user_id);

-- 3. VOLUNTEERS (Specific Details)
create table public.volunteers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null unique,
  is_available boolean default true,
  latitude float,
  longitude float,
  updated_at timestamp with time zone default now()
);

alter table public.volunteers enable row level security;

create policy "Volunteers viewable by everyone" on public.volunteers for select using (true);
create policy "Volunteers update own" on public.volunteers for update using (auth.uid() = user_id);
create policy "Volunteers insert own" on public.volunteers for insert with check (auth.uid() = user_id);

-- 4. NGOS (Specific Details)
create table public.ngos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null unique,
  organization_name text,
  verified boolean default false
);

alter table public.ngos enable row level security;

create policy "NGOs viewable by everyone" on public.ngos for select using (true);
create policy "Admins manage NGOs" on public.ngos for all using (
  exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

-- 5. DONATIONS (Core Logic)
create table public.donations (
  id uuid primary key default uuid_generate_v4(),
  donor_id uuid references auth.users not null,
  food_type text not null,
  quantity text not null,
  address text not null, -- Pickup Location
  drop_location text, -- Set when assigned to NGO
  status text default 'pending' check (status in ('pending', 'approved', 'assigned', 'picked_up', 'delivered', 'rejected')),
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.donations enable row level security;

create policy "Donations viewable by authorized" on public.donations for select using (true);
create policy "Donors insert own" on public.donations for insert with check (auth.uid() = donor_id);
create policy "Admins and Volunteers update status" on public.donations for update using (
  exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'volunteer', 'ngo'))
);

-- 6. DELIVERIES (Live Tracking)
create table public.deliveries (
  id uuid primary key default uuid_generate_v4(),
  donation_id uuid references public.donations not null,
  volunteer_id uuid references auth.users not null,
  live_lat float,
  live_lng float,
  status text default 'assigned',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.deliveries enable row level security;

create policy "Deliveries viewable by everyone" on public.deliveries for select using (true);
create policy "Volunteers update their delivery" on public.deliveries for update using (auth.uid() = volunteer_id);
create policy "System/Admin insert deliveries" on public.deliveries for insert with check (true);

-- 7. VOLUNTEER TASKS (Association Table for clarity, or reuse Deliveries)
-- For this schema, we will use 'volunteer_tasks' to map assignments before live tracking starts
create table public.volunteer_tasks (
  id uuid primary key default uuid_generate_v4(),
  donation_id uuid references public.donations not null,
  volunteer_id uuid references auth.users not null,
  status text default 'assigned',
  created_at timestamp with time zone default now()
);

alter table public.volunteer_tasks enable row level security;
create policy "Tasks viewable by everyone" on public.volunteer_tasks for select using (true);
create policy "Volunteers/Admins insert/update tasks" on public.volunteer_tasks for all using (true);

-- TRIGGERS for Updated At
create or replace function update_modified_column() 
returns trigger as $$
begin
    new.updated_at = now();
    return new; 
end;
$$ language 'plpgsql';

create trigger update_donations_modtime before update on public.donations for each row execute procedure update_modified_column();
create trigger update_deliveries_modtime before update on public.deliveries for each row execute procedure update_modified_column();
