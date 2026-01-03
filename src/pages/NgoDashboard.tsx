import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Search,
  AlertCircle,
  History,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function NgoDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Data States
  const [incomingDeliveries, setIncomingDeliveries] = useState<any[]>([]); // Status: picked_up
  const [availableDonations, setAvailableDonations] = useState<any[]>([]); // Status: approved
  const [history, setHistory] = useState<any[]>([]); // Status: delivered

  // UI States
  const [activeTab, setActiveTab] = useState("incoming");

  useEffect(() => {
    if (user) refreshData();
  }, [user]);

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchIncoming(),
      fetchAvailable(),
      fetchHistory()
    ]);
    setLoading(false);
  };

  /* Shared data fetching helpers */
  const fetchProfilesAndRoles = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: volunteers } = await supabase.from('volunteers').select('*');
    return { profiles: profiles || [], volunteers: volunteers || [] };
  };

  const enrichDonation = (donation: any, profiles: any[], volunteers: any[], tasks: any[]) => {
    const donorProfile = profiles.find(p => p.user_id === donation.donor_id);
    const relatedTask = tasks.find(t => t.donation_id === donation.id);
    let taskWithProfile = null;

    if (relatedTask) {
      const vol = volunteers.find(v => v.id === relatedTask.volunteer_id);
      const volProfile = vol ? profiles.find(p => p.user_id === vol.user_id) : null;
      taskWithProfile = {
        ...relatedTask,
        profiles: volProfile ? { full_name: volProfile.full_name, phone_number: volProfile.phone } : null
      };
    }

    return {
      ...donation,
      profiles: donorProfile ? { full_name: donorProfile.full_name } : null,
      volunteer_tasks: taskWithProfile ? [taskWithProfile] : []
    };
  };

  const fetchIncoming = async () => {
    const { data: donations } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'picked_up')
      .order('updated_at', { ascending: false });

    // Fetch related tasks for these donations
    const donationIds = (donations || []).map(d => d.id);
    const { data: tasks } = await supabase.from('volunteer_tasks').select('*').in('donation_id', donationIds);
    const { profiles, volunteers } = await fetchProfilesAndRoles();

    const enriched = (donations || []).map(d => enrichDonation(d, profiles, volunteers, tasks || []));
    setIncomingDeliveries(enriched);
  };

  const fetchAvailable = async () => {
    const { data: donations } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    const { profiles, volunteers } = await fetchProfilesAndRoles();
    // Tasks might not exist yet for approved, or filtered out, but enrich function handles nulls
    const enriched = (donations || []).map(d => enrichDonation(d, profiles, volunteers, []));
    setAvailableDonations(enriched);
  };

  const fetchHistory = async () => {
    const { data: donations } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'delivered')
      .order('updated_at', { ascending: false })
      .limit(10);

    setHistory(donations || []);
  };

  const handleConfirmReceipt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('donations')
        .update({ status: 'delivered' })
        .eq('id', id);

      if (error) throw error;

      // Also update volunteer task
      // We need to find the active task for this donation
      // (Simplified: backend triggers usually handle this, but we do it manually for demo)
      const { data: tasks } = await supabase.from('volunteer_tasks').select('id').eq('donation_id', id);
      if (tasks && tasks.length > 0) {
        await supabase.from('volunteer_tasks').update({ status: 'delivered' }).eq('id', tasks[0].id);
      }

      toast({ title: "Receipt Confirmed", description: "Inventory updated." });
      refreshData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout role="ngo">
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold font-display">NGO Command Center</h1>
          <p className="text-muted-foreground">Monitor incoming aid and manage inventory.</p>
        </div>

        {/* High Priority: Incoming Deliveries */}
        {incomingDeliveries.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600 animate-pulse">
              <Truck className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-wider text-sm">Arriving Soon</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incomingDeliveries.map(delivery => (
                <motion.div layout key={delivery.id}>
                  <Card className="border-orange-200 bg-orange-50/50 shadow-sm overflow-hidden">
                    <div className="h-1 bg-orange-500 w-full" />
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{delivery.food_type}</h3>
                          <p className="text-sm text-gray-600">{delivery.quantity}</p>
                        </div>
                        <Badge className="bg-orange-500 hover:bg-orange-600">On the way</Badge>
                      </div>

                      <div className="text-sm space-y-2 text-gray-600">
                        <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> From: {delivery.profiles?.full_name}</p>
                        <p className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Driver: {delivery.volunteer_tasks?.[0]?.profiles?.full_name || "Assigned Driver"}
                        </p>
                        <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> ETA: 15 mins</p>
                      </div>

                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleConfirmReceipt(delivery.id)}>
                        <CheckCircle className="mr-2 w-4 h-4" /> Confirm Receipt
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="incoming">Available Food</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="requests">My Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold">Claim Donations</h2>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search food..." className="pl-8" />
              </div>
            </div>

            {availableDonations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No donations available at the moment.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableDonations.map(item => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex border-b pb-3 justify-between">
                        <div>
                          <h3 className="font-semibold">{item.food_type}</h3>
                          <p className="text-xs text-muted-foreground">{item.quantity}</p>
                        </div>
                        <Badge variant="outline" className="h-6">Active</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="line-clamp-1">{item.address}</p>
                        <p className="text-xs text-gray-400">By {item.profiles?.full_name}</p>
                      </div>
                      <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
                        Contact Donor
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <div className="divide-y">
                {history.map(item => (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{item.food_type}</p>
                        <p className="text-sm text-muted-foreground">Received on {new Date(item.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                ))}
                {history.length === 0 && <p className="p-8 text-center text-muted-foreground">No history yet.</p>}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <div className="bg-gray-50 border border-dashed rounded-xl p-8 text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-gray-300 mx-auto" />
              <div>
                <h3 className="font-medium">Request Specific Items</h3>
                <p className="text-sm text-muted-foreground">Broadcast your needs to donors nearby.</p>
              </div>
              <Button>Create Request</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
