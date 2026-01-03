-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'ngo', 'donor', 'volunteer');

-- Create user roles table (for secure role-based access)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_badge TEXT, -- 'verified_donor', 'verified_ngo', etc.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NGOs table
CREATE TABLE public.ngos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    registration_number TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    description TEXT,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donations table
CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    food_type TEXT NOT NULL,
    food_category TEXT NOT NULL, -- 'restaurant', 'event', 'household', 'corporate'
    quantity TEXT NOT NULL,
    quantity_unit TEXT DEFAULT 'servings',
    description TEXT,
    image_url TEXT,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    pickup_time_start TIMESTAMP WITH TIME ZONE,
    pickup_time_end TIMESTAMP WITH TIME ZONE,
    hygiene_confirmed BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'picked', 'delivered', 'cancelled'
    accepted_by_ngo UUID REFERENCES public.ngos(id),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create volunteers table
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    availability TEXT DEFAULT 'available', -- 'available', 'busy', 'offline'
    vehicle_type TEXT, -- 'bike', 'car', 'scooter', 'walk'
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    total_deliveries INTEGER DEFAULT 0,
    impact_score INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create volunteer tasks table
CREATE TABLE public.volunteer_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE NOT NULL,
    volunteer_id UUID REFERENCES public.volunteers(id),
    ngo_id UUID REFERENCES public.ngos(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'assigned', 'on_the_way', 'picked', 'delivered', 'cancelled'
    pickup_otp TEXT,
    delivery_otp TEXT,
    estimated_distance DECIMAL(10, 2),
    estimated_time INTEGER, -- in minutes
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin verifications table
CREATE TABLE public.admin_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'ngo', 'donor'
    entity_id UUID NOT NULL,
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'urgent'
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transport logs table
CREATE TABLE public.transport_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.volunteer_tasks(id) ON DELETE CASCADE NOT NULL,
    transport_type TEXT NOT NULL, -- 'volunteer', 'auto', 'erickshaw'
    cost DECIMAL(10, 2) DEFAULT 0,
    paid_by TEXT, -- 'csr', 'donor', 'platform'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ngos
CREATE POLICY "Anyone can view verified NGOs"
ON public.ngos FOR SELECT
USING (verified = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "NGO users can update their own NGO"
ON public.ngos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "NGO users can insert their own NGO"
ON public.ngos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all NGOs"
ON public.ngos FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for donations
CREATE POLICY "Anyone authenticated can view donations"
ON public.donations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Donors can create donations"
ON public.donations FOR INSERT
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update their own donations"
ON public.donations FOR UPDATE
USING (auth.uid() = donor_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ngo'));

CREATE POLICY "Donors can delete their pending donations"
ON public.donations FOR DELETE
USING (auth.uid() = donor_id AND status = 'pending');

-- RLS Policies for volunteers
CREATE POLICY "Anyone can view volunteers"
ON public.volunteers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Volunteers can manage their own record"
ON public.volunteers FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all volunteers"
ON public.volunteers FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for volunteer_tasks
CREATE POLICY "Anyone authenticated can view tasks"
ON public.volunteer_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "NGOs can create tasks"
ON public.volunteer_tasks FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'ngo') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned volunteers and NGOs can update tasks"
ON public.volunteer_tasks FOR UPDATE
USING (
    volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid())
    OR ngo_id IN (SELECT id FROM public.ngos WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for admin_verifications
CREATE POLICY "Admins can manage verifications"
ON public.admin_verifications FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own verification requests"
ON public.admin_verifications FOR SELECT
USING (requested_by = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- RLS Policies for transport_logs
CREATE POLICY "Anyone authenticated can view transport logs"
ON public.transport_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage transport logs"
ON public.transport_logs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ngos_updated_at
    BEFORE UPDATE ON public.ngos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at
    BEFORE UPDATE ON public.volunteers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_volunteer_tasks_updated_at
    BEFORE UPDATE ON public.volunteer_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_verifications_updated_at
    BEFORE UPDATE ON public.admin_verifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteer_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role app_role;
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, phone, location)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'location'
    );
    
    -- Assign role based on metadata
    user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'donor');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    -- Create volunteer record if volunteer role
    IF user_role = 'volunteer' THEN
        INSERT INTO public.volunteers (user_id)
        VALUES (NEW.id);
    END IF;
    
    -- Create NGO record if NGO role
    IF user_role = 'ngo' THEN
        INSERT INTO public.ngos (user_id, name, address, city, state)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'NGO'),
            COALESCE(NEW.raw_user_meta_data->>'location', 'Address pending'),
            'City pending',
            'State pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();