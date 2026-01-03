import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  CheckCircle,
  Package,
  MapPin,
  Loader2,
  Phone,
  ArrowRight,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InteractiveMap } from "@/components/InteractiveMap";

interface VolunteerTask {
  id: string;
  status: string;
  donation_id: string;
  donations: {
    food_type: string;
    quantity: string;
    address: string;
    donor_id: string;
    profiles?: { full_name: string; phone?: string }; // Joined donor profile
  } | null;
  created_at: string;
}

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<VolunteerTask | null>(null);
  const [availableDonations, setAvailableDonations] = useState<any[]>([]);
  const [onlineStatus, setOnlineStatus] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCurrentTask();
      fetchAvailableDonations();
    }
  }, [user]);

  const fetchCurrentTask = async () => {
    try {
      // Fetch only the most relevant active task
      const { data, error } = await supabase
        .from('volunteer_tasks')
        .select(`*, donations(*, profiles(full_name))`)
        .eq('volunteer_id', user?.id)
        .in('status', ['assigned', 'accepted', 'picked_up'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setActiveTask(data && data.length > 0 ? (data[0] as any) : null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`*, profiles(full_name)`)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableDonations(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeTask) return;
    try {
      const { error } = await supabase
        .from('volunteer_tasks')
        .update({ status: newStatus })
        .eq('id', activeTask.id);

      if (error) throw error;

      if (newStatus === 'delivered' || newStatus === 'picked_up') {
        await supabase.from('donations').update({ status: newStatus }).eq('id', activeTask.donation_id);
      }

      toast({ title: "Status Updated", description: `Task marked as ${newStatus.replace('_', ' ')}` });

      if (newStatus === 'delivered') {
        setActiveTask(null); // Clear task on delivery
      } else {
        fetchCurrentTask(); // Refresh state
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAcceptDonation = async (donationId: string) => {
    try {
      const { error } = await supabase
        .from('volunteer_tasks')
        .insert({
          donation_id: donationId,
          volunteer_id: user?.id,
          status: 'assigned'
        })
        .select(`*, donations(*, profiles(full_name))`)
        .single();

      if (error) throw error;

      await supabase.from('donations').update({ status: 'assigned' }).eq('id', donationId);

      toast({ title: "Task Accepted", description: "Navigate to pickup location." });
      // Immediately set active task to avoid refetch delay
      fetchCurrentTask();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Map Markers logic
  const mapMarkers = activeTask
    ? [
      {
        id: 'pickup',
        position: [28.6139, 77.2090], // Mock Pickup
        title: "Pickup Location",
        description: activeTask.donations?.address
      },
      {
        id: 'drop',
        position: [28.65, 77.23], // Mock Drop (NGO)
        title: "Drop Location",
        description: "Partner NGO"
      }
    ]
    : availableDonations.map(d => ({
      id: d.id,
      position: [28.61 + (Math.random() - 0.5) * 0.1, 77.21 + (Math.random() - 0.5) * 0.1],
      title: d.food_type,
      description: d.address
    }));

  return (
    <DashboardLayout role="volunteer">
      <div className="relative h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] w-full overflow-hidden rounded-xl border border-border bg-gray-100">

        {/* Full Screen Map */}
        <div className="absolute inset-0 z-0">
          <InteractiveMap
            markers={mapMarkers as any}
            zoom={activeTask ? 14 : 12}
            className="h-full w-full"
            route={activeTask ? {
              start: [28.6139, 77.2090],
              end: [28.65, 77.23],
              color: 'blue'
            } : undefined}
          />
        </div>

        {/* Top Floating Status Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg flex items-center gap-2 px-4 border border-gray-200">
            <div className={`w-3 h-3 rounded-full ${onlineStatus ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm font-semibold">{onlineStatus ? "You are Online" : "Offline"}</span>
          </div>
          <Button
            className="pointer-events-auto rounded-full w-10 h-10 shadow-lg bg-white text-black hover:bg-gray-100 border border-gray-200"
            size="icon"
            onClick={() => {
              // Center map logic could go here
            }}
          >
            <Navigation className="w-5 h-5 text-primary" />
          </Button>
        </div>

        {/* Bottom Action Sheet (Task Overlay) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <AnimatePresence mode="wait">
            {activeTask ? (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="pointer-events-auto bg-white rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.1)] p-6 pb-24 lg:pb-6 max-w-2xl mx-auto"
              >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold font-display">{activeTask.donations?.food_type}</h2>
                    <p className="text-muted-foreground text-sm flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-1 text-primary" />
                      {activeTask.donations?.address}
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {activeTask.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Package className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="font-semibold">{activeTask.donations?.quantity}</p>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Phone className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Donor</p>
                      <p className="font-semibold">{activeTask.donations?.profiles?.full_name || "Contact"}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Buttons */}
                <div className="space-y-3">
                  {activeTask.status === 'assigned' && (
                    <Button className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/20" variant="hero" onClick={() => handleUpdateStatus('accepted')}>
                      Accept Task <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  )}
                  {activeTask.status === 'accepted' && (
                    <Button className="w-full text-lg h-14 font-bold bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20" onClick={() => handleUpdateStatus('picked_up')}>
                      Arrived at Pickup
                    </Button>
                  )}
                  {activeTask.status === 'picked_up' && (
                    <Button className="w-full text-lg h-14 font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" onClick={() => handleUpdateStatus('delivered')}>
                      <CheckCircle className="mr-2 w-5 h-5" /> Confirm Delivery
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              /* No Active Task - Scan Mode */
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="pointer-events-auto bg-white rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.1)] p-6 pb-24 lg:pb-6 max-w-2xl mx-auto"
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-4">Nearby Requests ({availableDonations.length})</h2>

                {availableDonations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary/50" />
                    Scanning for new donations...
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                    {availableDonations.map(donation => (
                      <div key={donation.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 font-bold text-gray-400">
                            {donation.food_type[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{donation.food_type}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">{donation.address}</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleAcceptDonation(donation.id)}>Accept</Button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
