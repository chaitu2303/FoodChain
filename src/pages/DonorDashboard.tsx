import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clock,
  MapPin,
  Calendar,
  Package,
  ChevronRight,
  Utensils,
  History,
  Timer,
  Upload,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { InteractiveMap } from "@/components/InteractiveMap";

interface Donation {
  id: string;
  food_type: string;
  quantity: string;
  address: string;
  status: string;
  created_at: string;
  volunteer_tasks: any[];
  image_url?: string;
}

const statusConfig = {
  pending: { label: "Approval Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Looking for Volunteer", color: "bg-blue-100 text-blue-800", icon: Loader2 },
  assigned: { label: "Volunteer Assigned", color: "bg-purple-100 text-purple-800", icon: MapPin },
  picked_up: { label: "On the way", color: "bg-orange-100 text-orange-800", icon: BikeIcon },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: Package },
  rejected: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: Utensils },
};

// Start Icon Mock
function BikeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  )
}

export default function DonorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    food_type: "",
    quantity: "",
    address: "",
    expiry: "",
    image_url: ""
  });

  useEffect(() => {
    if (user) fetchDonations();
  }, [user]);

  /* Diagnostic State */
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const fetchDonations = async () => {
    setLoading(true);
    setErrorDetails(null);
    try {
      // 1. Fetch Donations
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .eq('donor_id', user?.id)
        .order('created_at', { ascending: false });

      if (donationsError) throw donationsError;

      // 2. Fetch Related Data (Tasks, Volunteers, Profiles)
      const donationIds = (donationsData || []).map(d => d.id);

      const { data: tasksData } = await supabase
        .from('volunteer_tasks')
        .select('*')
        .in('donation_id', donationIds);

      const { data: volunteersData } = await supabase
        .from('volunteers')
        .select('*');

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      // 3. Manual Join
      const fullDonations = (donationsData || []).map(donation => {
        // Find tasks for this donation
        const tasks = (tasksData || []).filter(t => t.donation_id === donation.id);

        // Enrich tasks with volunteer profiles
        const enrichedTasks = tasks.map(task => {
          const volunteer = volunteersData?.find(v => v.id === task.volunteer_id);
          const profile = volunteer ? profilesData?.find(p => p.user_id === volunteer.user_id) : null;
          return {
            ...task,
            profiles: profile ? { full_name: profile.full_name } : null
          };
        });

        return {
          ...donation,
          volunteer_tasks: enrichedTasks
        };
      });

      setDonations(fullDonations);
    } catch (error: any) {
      console.error(error);
      setErrorDetails(error.message);
      toast({ title: "Error loading data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('donations').insert({
        donor_id: user.id,
        food_type: formData.food_type,
        quantity: formData.quantity,
        address: formData.address,
        status: 'pending',
      });

      if (error) throw error;

      toast({ title: "Donation Request Sent", description: "Admin will review shortly." });
      setIsDialogOpen(false);
      setFormData({ food_type: "", quantity: "", address: "", expiry: "", image_url: "" });
      fetchDonations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const activeDonations = donations.filter(d => ['pending', 'approved', 'assigned', 'picked_up'].includes(d.status));
  const pastDonations = donations.filter(d => ['delivered', 'rejected'].includes(d.status));

  return (
    <DashboardLayout role="donor">
      <div className="max-w-md mx-auto sm:max-w-2xl lg:max-w-4xl space-y-6 pb-20">

        {/* Error Alert */}
        {errorDetails && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-3">
            <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse" />
            <div>
              <p className="font-bold">System Error</p>
              <p className="text-sm font-mono mt-1">{errorDetails}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display">Your Contributions</h1>
            <p className="text-sm text-muted-foreground">Track live deliveries</p>
          </div>
          {/* History Icon or Stats would go here */}
        </div>

        {/* Floating Action Button (Mobile) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg shadow-primary/30 z-50 lg:hidden"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          {/* Desktop Button */}
          <DialogTrigger asChild>
            <Button className="hidden lg:flex" size="lg">
              <Plus className="mr-2 h-4 w-4" /> Donate Food
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Share Surplus Food</DialogTitle>
              <DialogDescription>Quickly list food for pickup.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Food Item</Label>
                  <Input placeholder="e.g. Rice & Curry" value={formData.food_type} onChange={e => setFormData({ ...formData, food_type: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input placeholder="e.g. 5kg" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pickup Address</Label>
                <Textarea placeholder="Full Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label>Add Photo (Optional)</Label>
                <Input placeholder="Image URL" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : "Request Pickup"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Active Donations Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Orders</h2>
          {loading ? (
            <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
          ) : activeDonations.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed text-muted-foreground">
              <Package className="h-10 w-10 mx-auto opacity-20 mb-2" />
              <p>No active donations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDonations.map(donation => {
                const StatusIcon = statusConfig[donation.status as keyof typeof statusConfig]?.icon || Clock;
                const statusStyle = statusConfig[donation.status as keyof typeof statusConfig]?.color || "bg-gray-100 text-gray-800";
                const statusLabel = statusConfig[donation.status as keyof typeof statusConfig]?.label || donation.status;
                const isExpanded = expandedId === donation.id;

                return (
                  <motion.div layout key={donation.id}>
                    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-4" onClick={() => setExpandedId(isExpanded ? null : donation.id)}>
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                              <Utensils className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{donation.food_type}</h3>
                              <p className="text-xs text-muted-foreground">{donation.quantity} • {new Date(donation.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge className={statusStyle}>
                            <StatusIcon className="h-3 w-3 mr-1" /> {statusLabel}
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4 flex gap-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${['pending', 'approved', 'assigned', 'picked_up', 'delivered'].includes(donation.status) ? 'bg-primary' : 'bg-transparent'} flex-1`} />
                          <div className={`h-full ${['approved', 'assigned', 'picked_up', 'delivered'].includes(donation.status) ? 'bg-primary' : 'bg-transparent'} flex-1`} />
                          <div className={`h-full ${['assigned', 'picked_up', 'delivered'].includes(donation.status) ? 'bg-primary' : 'bg-transparent'} flex-1`} />
                          <div className={`h-full ${['picked_up', 'delivered'].includes(donation.status) ? 'bg-primary' : 'bg-transparent'} flex-1`} />
                        </div>

                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {donation.volunteer_tasks?.[0]?.profiles?.full_name ? `Agent: ${donation.volunteer_tasks[0].profiles.full_name}` : "Matching agent..."}
                          </span>
                          <Button variant="ghost" size="sm" className="text-primary h-8 px-2">
                            {isExpanded ? "Hide Map" : "Track Order"} <ChevronRight className={`ml-1 h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Map View */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="h-48 w-full bg-gray-100 relative">
                              {['assigned', 'picked_up'].includes(donation.status) ? (
                                <InteractiveMap
                                  center={[28.6139, 77.2090]} // Mock center
                                  markers={[{
                                    id: donation.id,
                                    position: [28.6139 + (Math.random() * 0.01), 77.2090 + (Math.random() * 0.01)],
                                    title: "Volunteer Location"
                                  }]}
                                  zoom={12}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                                  <MapPin className="h-4 w-4 mr-2" /> Map active when volunteer is assigned
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Donations Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Orders</h2>
          <div className="space-y-3">
            {pastDonations.map(donation => (
              <div key={donation.id} className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 opacity-60 grayscale hover:grayscale-0 transition-all">
                <div className="flex gap-3 items-center">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{donation.food_type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(donation.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant="outline">{donation.status}</Badge>
              </div>
            ))}
            {pastDonations.length === 0 && (
              <p className="text-sm text-muted-foreground">No history yet.</p>
            )}
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
