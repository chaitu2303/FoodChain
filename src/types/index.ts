export type UserRole = 'admin' | 'donor' | 'volunteer' | 'ngo';

export interface UserProfile {
    id: string;
    user_id: string;
    full_name: string | null;
    phone: string | null;
    location: string | null;
    role: UserRole;
    approved: boolean; // New field from user_roles
}

export interface Donation {
    id: string;
    donor_id: string;
    food_type: string;
    quantity: string;
    address: string;
    drop_location?: string;
    status: 'pending' | 'approved' | 'assigned' | 'picked_up' | 'delivered' | 'rejected';
    image_url?: string;
    created_at: string;
    updated_at: string;
    profiles?: { full_name: string }; // Joined
}

export interface Volunteer {
    id: string;
    user_id: string;
    is_available: boolean;
    latitude: number | null;
    longitude: number | null;
}

export interface Delivery {
    id: string;
    donation_id: string;
    volunteer_id: string;
    live_lat: number;
    live_lng: number;
    status: string;
}
