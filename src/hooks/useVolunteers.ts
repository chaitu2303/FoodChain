import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useEffect } from "react";

export interface Volunteer {
  id: string;
  user_id: string;
  availability: string;
  vehicle_type: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  total_deliveries: number;
  impact_score: number;
  badges: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

export interface VolunteerTask {
  id: string;
  donation_id: string;
  volunteer_id: string | null;
  ngo_id: string;
  status: string;
  pickup_otp: string | null;
  delivery_otp: string | null;
  estimated_distance: number | null;
  estimated_time: number | null;
  actual_pickup_time: string | null;
  actual_delivery_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  donation?: {
    food_type: string;
    quantity: string;
    pickup_address: string;
  };
  ngo?: {
    name: string;
    address: string;
  };
}

export function useMyVolunteer() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-volunteer", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("volunteers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Volunteer | null;
    },
    enabled: !!user,
  });
}

export function useVolunteerTasks(filters?: { status?: string; volunteer_id?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["volunteer-tasks", filters],
    queryFn: async () => {
      let query = supabase
        .from("volunteer_tasks")
        .select(`
          *,
          donation:donations(food_type, quantity, pickup_address),
          ngo:ngos(name, address)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.volunteer_id) {
        query = query.eq("volunteer_id", filters.volunteer_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as VolunteerTask[];
    },
    enabled: !!user,
  });
}

export function useAvailableTasks() {
  return useVolunteerTasks({ status: "pending" });
}

export function useMyTasks() {
  const { data: volunteer } = useMyVolunteer();
  return useVolunteerTasks({ volunteer_id: volunteer?.id });
}

export function useAcceptTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, volunteerId }: { taskId: string; volunteerId: string }) => {
      // Generate OTPs
      const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

      const { data, error } = await supabase
        .from("volunteer_tasks")
        .update({
          volunteer_id: volunteerId,
          status: "assigned",
          pickup_otp: pickupOtp,
          delivery_otp: deliveryOtp,
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-tasks"] });
      toast({
        title: "Task Accepted!",
        description: "Navigate to the pickup location to collect the food.",
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

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      status,
      volunteerId,
    }: {
      taskId: string;
      status: string;
      volunteerId?: string;
    }) => {
      const updates: Record<string, unknown> = { status };

      if (status === "picked") {
        updates.actual_pickup_time = new Date().toISOString();
      }
      if (status === "delivered") {
        updates.actual_delivery_time = new Date().toISOString();

        // Update volunteer stats
        if (volunteerId) {
          const { data: volunteer } = await supabase
            .from("volunteers")
            .select("total_deliveries, impact_score")
            .eq("id", volunteerId)
            .single();

          if (volunteer) {
            await supabase
              .from("volunteers")
              .update({
                total_deliveries: volunteer.total_deliveries + 1,
                impact_score: volunteer.impact_score + 10,
              })
              .eq("id", volunteerId);
          }
        }
      }

      const { data, error } = await supabase
        .from("volunteer_tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer"] });

      const messages: Record<string, string> = {
        on_the_way: "You're on the way to pickup!",
        picked: "Pickup confirmed! Head to the NGO.",
        delivered: "Delivery confirmed! Great job!",
      };

      toast({
        title: "Status Updated",
        description: messages[variables.status] || "Task status updated.",
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

export function useVolunteerLeaderboard() {
  return useQuery({
    queryKey: ["volunteer-leaderboard"],
    queryFn: async () => {
      const { data: volunteers, error } = await supabase
        .from("volunteers")
        .select("*")
        .order("impact_score", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch profiles for these volunteers
      const userIds = volunteers?.map(v => v.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      return (volunteers || []).map(v => ({
        ...v,
        profile: { full_name: profileMap.get(v.user_id) || "Unknown" }
      })) as (Volunteer & { profile: { full_name: string } })[];
    },
  });
}

export function useTasksRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "volunteer_tasks",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["volunteer-tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
