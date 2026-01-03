import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface NGO {
  id: string;
  user_id: string;
  name: string;
  registration_number: string | null;
  address: string;
  city: string;
  state: string;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useNgos(filters?: { verified?: boolean }) {
  return useQuery({
    queryKey: ["ngos", filters],
    queryFn: async () => {
      let query = supabase
        .from("ngos")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.verified !== undefined) {
        query = query.eq("verified", filters.verified);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as NGO[];
    },
  });
}

export function useMyNgo() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-ngo", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("ngos")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as NGO | null;
    },
    enabled: !!user,
  });
}

export function useUpdateNgo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NGO> }) => {
      const { data, error } = await supabase
        .from("ngos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ngos"] });
      queryClient.invalidateQueries({ queryKey: ["my-ngo"] });
      toast({
        title: "NGO Updated",
        description: "Your organization details have been updated.",
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

export function useVerifyNgo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ ngoId, approved }: { ngoId: string; approved: boolean }) => {
      const { data, error } = await supabase
        .from("ngos")
        .update({
          verified: approved,
          verified_at: approved ? new Date().toISOString() : null,
          verified_by: approved ? user?.id : null,
        })
        .eq("id", ngoId)
        .select()
        .single();

      if (error) throw error;

      // Update profile verification badge if approved
      if (approved && data) {
        await supabase
          .from("profiles")
          .update({
            is_verified: true,
            verification_badge: "verified_ngo",
          })
          .eq("user_id", data.user_id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ngos"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      toast({
        title: variables.approved ? "NGO Verified!" : "NGO Rejected",
        description: variables.approved
          ? "The organization has been approved and notified."
          : "The organization has been notified with feedback.",
        variant: variables.approved ? "default" : "destructive",
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

export function usePendingNgos() {
  return useNgos({ verified: false });
}
