import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useEffect } from "react";

export interface Donation {
  id: string;
  donor_id: string;
  food_type: string;
  food_category: string;
  quantity: string;
  quantity_unit: string;
  description: string | null;
  image_url: string | null;
  expiry_time: string;
  pickup_address: string;
  latitude: number | null;
  longitude: number | null;
  pickup_time_start: string | null;
  pickup_time_end: string | null;
  hygiene_confirmed: boolean;
  status: string;
  accepted_by_ngo: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  donor_profile?: {
    full_name: string;
    is_verified: boolean;
  };
}

export interface CreateDonationInput {
  food_type: string;
  food_category: string;
  quantity: string;
  quantity_unit?: string;
  description?: string;
  image_url?: string;
  expiry_time: string;
  pickup_address: string;
  latitude?: number;
  longitude?: number;
  pickup_time_start?: string;
  pickup_time_end?: string;
  hygiene_confirmed: boolean;
}

export function useDonations(filters?: { status?: string; donor_id?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["donations", filters],
    queryFn: async () => {
      let query = supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.donor_id) {
        query = query.eq("donor_id", filters.donor_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Donation[];
    },
    enabled: !!user,
  });
}

export function useMyDonations() {
  const { user } = useAuth();
  return useDonations({ donor_id: user?.id });
}

export function useAvailableDonations() {
  return useDonations({ status: "pending" });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateDonationInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("donations")
        .insert({
          ...input,
          donor_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast({
        title: "Donation Posted!",
        description: "NGOs will be notified about your donation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDonation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Donation> }) => {
      const { data, error } = await supabase
        .from("donations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAcceptDonation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ donationId, ngoId }: { donationId: string; ngoId: string }) => {
      const { data, error } = await supabase
        .from("donations")
        .update({
          status: "accepted",
          accepted_by_ngo: ngoId,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", donationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast({
        title: "Donation Accepted!",
        description: "A volunteer will be assigned for pickup shortly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDonationsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("donations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donations",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["donations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
