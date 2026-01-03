import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface AdminStats {
  totalUsers: number;
  activeNgos: number;
  pendingNgos: number;
  totalDonations: number;
  activeDonations: number;
  totalVolunteers: number;
}

export interface AdminVerification {
  id: string;
  entity_type: string;
  entity_id: string;
  requested_by: string | null;
  approved_by: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdminStats() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Get total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get NGO counts
      const { count: totalNgos } = await supabase
        .from("ngos")
        .select("*", { count: "exact", head: true })
        .eq("verified", true);

      const { count: pendingNgos } = await supabase
        .from("ngos")
        .select("*", { count: "exact", head: true })
        .eq("verified", false);

      // Get donation counts
      const { count: totalDonations } = await supabase
        .from("donations")
        .select("*", { count: "exact", head: true });

      const { count: activeDonations } = await supabase
        .from("donations")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "accepted", "picked"]);

      // Get volunteer count
      const { count: totalVolunteers } = await supabase
        .from("volunteers")
        .select("*", { count: "exact", head: true });

      return {
        totalUsers: usersCount || 0,
        activeNgos: totalNgos || 0,
        pendingNgos: pendingNgos || 0,
        totalDonations: totalDonations || 0,
        activeDonations: activeDonations || 0,
        totalVolunteers: totalVolunteers || 0,
      } as AdminStats;
    },
    enabled: role === "admin",
  });
}

export function useAdminVerifications() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_verifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdminVerification[];
    },
    enabled: role === "admin",
  });
}

export function useProcessVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      verificationId,
      approved,
      notes,
    }: {
      verificationId: string;
      approved: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("admin_verifications")
        .update({
          status: approved ? "approved" : "rejected",
          approved_by: user?.id,
          notes,
        })
        .eq("id", verificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      toast({
        title: variables.approved ? "Verification Approved" : "Verification Rejected",
        description: variables.approved
          ? "The entity has been verified."
          : "The verification request has been rejected.",
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

export function useAllUsers() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles(role)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: role === "admin",
  });
}
