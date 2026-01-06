import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  Package,
  TrendingUp,
  Shield,
  CheckCircle,
  Ban,
  Download,
  Loader2,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveMap } from "@/components/InteractiveMap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { saveAs } from 'file-saver';

interface Donation {
  id: string;
  food_type: string | null;
  quantity: string | null;
  address: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

interface UserProfile {
  id: string; // The primary key (uuid) which is also the user_id reference
  full_name: string | null;
  phone: string | null;
  location: string | null;
  role?: string;
  approved?: boolean;
  created_at?: string; // Standard Supabase timestamp
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboard() {
  const { toast } = useToast();
  // Get active tab from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get('tab') || 'donations';

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    activeDonations: 0,
    completed: 0
  });

  /* Migration Check State */
  const [migrationMissing, setMigrationMissing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setMigrationMissing(false);
    try {
      // 1. Fetch Donations
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (donationsError) {
        console.error("Donations fetch error:", donationsError);
        throw new Error(`Donations: ${donationsError.message}`);
      }

      // 2. Fetch Profiles (now includes role and approved)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        throw new Error(`Profiles: ${profilesError.message}`);
      }

      // No need to fetch user_roles or join manually
      // Ensure role defaults are handled if null (though DB should handle it)
      const usersData = (profilesData || []).map(p => ({
        ...p,
        role: p.role || 'user',
        approved: p.approved || false
      }));

      // Manually join profiles to donations
      const mappedDonations = (donationsData || []).map((d: any) => {
        const donorProfile = profilesData?.find(p => p.id === d.donor_id);
        return {
          ...d,
          profiles: donorProfile ? { full_name: donorProfile.full_name } : null
        };
      });

      setDonations(mappedDonations);
      setUsers(usersData); // usersData fits UserProfile interface if updated to match DB

      const active = (donationsData || []).filter(d => d.status === 'pending' || d.status === 'approved').length;
      const done = (donationsData || []).filter(d => d.status === 'delivered').length;

      setStats({
        users: profilesData?.length || 0,
        activeDonations: active,
        completed: done
      });

    } catch (error: any) {
      console.error("Error fetching data:", error);

      // Check for missing table error
      if (error.message && error.message.includes("does not exist")) {
        setMigrationMissing(true);
        toast({
          title: "Database Setup Required",
          description: "Required tables are missing. Please look at the dashboard for instructions.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error fetching data",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      // 1. Update Donation Status
      const { error } = await supabase
        .from('donations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      let description = `Donation marked as ${newStatus}`;

      // 2. Auto-Allocate Volunteer if Approved
      if (newStatus === 'approved') {
        // Find nearest verified volunteer
        const verifiedVolunteers = users.filter(u => u.role === 'volunteer' && u.approved);

        if (verifiedVolunteers.length > 0) {
          // SIMULATION: In a real app, we would calculate Haversine distance between 
          // donor.address and volunteer.location (converted to coords).
          // Here we pick the first available one to demonstrate the "Auto-Allocation" flow.
          const chosenVol = verifiedVolunteers[0];

          // Create Task
          const { error: taskError } = await supabase
            .from('volunteer_tasks')
            .insert({
              donation_id: id,
              volunteer_id: chosenVol.id,
              status: 'assigned'
            });

          if (!taskError) {
            // Update status to assigned immediately as per "Automatic Volunteer Allocation" requirement
            await supabase.from('donations').update({ status: 'assigned' }).eq('id', id);
            description += " & Volunteer Auto-Assigned";
          }
        } else {
          description += " (No volunteers available for auto-assign)";
        }
      }

      toast({ title: "Status Updated", description });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAssignVolunteer = async (donationId: string, volunteerId: string) => {
    try {
      const { error } = await supabase
        .from('volunteer_tasks')
        .insert({
          donation_id: donationId,
          volunteer_id: volunteerId,
          status: 'assigned'
        });

      if (error) throw error;
      await supabase.from('donations').update({ status: 'assigned' }).eq('id', donationId);
      toast({ title: "Volunteer Assigned", description: "Task has been created." });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      toast({ title: "User Deleted", description: "Profile removed successfully." });
      fetchData();
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleVerifyUser = async (userId: string, status: boolean) => {
    try {
      // Update Access Approval (Profiles)
      const updates: any = { approved: status };
      if (status) {
        updates.first_login = false; // Mark first login as done upon approval as per requirements
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (profileError) throw profileError;

      toast({
        title: status ? "Access Granted" : "Access Revoked",
        description: `User has been ${status ? "approved" : "restricted"}.`
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteDonation = async (id: string) => {
    if (!confirm("Delete this donation permanently?")) return;
    try {
      const { error } = await supabase.from('donations').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Donation Deleted", description: "Record removed." });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const exportData = () => {
    const csvContent = [
      ["ID", "Food Type", "Quantity", "Address", "Status", "Date", "Donor"],
      ...donations.map(d => [d.id, d.food_type, d.quantity, d.address, d.status, d.created_at, d.profiles?.full_name])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "donations_export.csv");
  };

  // Prepare Chart Data
  const statusData = [
    { name: 'Pending', value: donations.filter(d => d.status === 'pending').length },
    { name: 'Approved', value: donations.filter(d => d.status === 'approved').length },
    { name: 'Assigned', value: donations.filter(d => d.status === 'assigned').length },
    { name: 'Delivered', value: donations.filter(d => d.status === 'delivered').length },
    { name: 'Rejected', value: donations.filter(d => d.status === 'rejected').length },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">

        {/* Migration Alert */}
        {migrationMissing && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 shadow-xl animate-bounce-subtle">
            <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
              <Ban className="h-6 w-6" /> Database Setup Required
            </h2>
            <p className="text-red-700 mt-2">
              The application cannot find the required tables (e.g., <code>user_roles</code>).
              This usually happens when the SQL migration hasn't been run.
            </p>
            <div className="mt-4 bg-white p-4 rounded border border-red-200 font-mono text-sm overflow-x-auto">
              1. Copy the SQL from <code>supabase/migrations/20250103_full_schema.sql</code><br />
              2. Go to <a href="https://app.supabase.com" target="_blank" className="underline font-bold text-blue-600">Supabase Dashboard</a> &gt; SQL Editor<br />
              3. Paste & Run the script.
            </div>
            <Button className="mt-4" variant="destructive" onClick={fetchData}>
              I have run the SQL - Try Again
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Overview, Analytics & Management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={fetchData}>
              Refresh Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center justify-between bg-card/80 backdrop-blur border-white/10">
            <div>
              <p className="text-sm text-muted-foreground">Active Donations</p>
              <p className="text-2xl font-bold">{stats.activeDonations}</p>
            </div>
            <Package className="h-8 w-8 text-primary opacity-20" />
          </Card>
          <Card className="p-4 flex items-center justify-between bg-card/80 backdrop-blur border-white/10">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.users}</p>
            </div>
            <Users className="h-8 w-8 text-primary opacity-20" />
          </Card>
          <Card className="p-4 flex items-center justify-between bg-card/80 backdrop-blur border-white/10">
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-success opacity-20" />
          </Card>
        </div>

        {/* Live Delivery Map */}
        <Card className="bg-card/80 backdrop-blur border-white/10 overflow-hidden shadow-lg border-2 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Fleet Command Center</CardTitle>
              <p className="text-sm text-muted-foreground">Real-time volunteer locations and active routes</p>
            </div>
            <Badge variant="outline" className="animate-pulse bg-green-50 text-green-700 border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2" /> Live Updates
            </Badge>
          </CardHeader>
          <CardContent className="p-0 h-[500px] relative">
            <InteractiveMap
              markers={[
                // Active Donations (Pickup Points)
                ...donations
                  .filter(d => ['assigned', 'picked_up'].includes(d.status))
                  .map(d => ({
                    id: d.id,
                    title: d.food_type || 'Pickup',
                    description: d.address,
                    position: [28.61 + (Math.random() - 0.5) * 0.05, 77.21 + (Math.random() - 0.5) * 0.05]
                  })),
                // Mock Volunteer Live Locations (Trucks)
                ...donations
                  .filter(d => d.status === 'picked_up')
                  .map(d => ({
                    id: `vol-${d.id}`,
                    title: `Volunteer: ${d.profiles?.full_name || 'Driver'}`,
                    description: 'En route to destination',
                    position: [28.61 + (Math.random() - 0.5) * 0.06, 77.21 + (Math.random() - 0.5) * 0.06]
                  }))
              ]}
              zoom={12}
              className="h-full w-full"
            />
            {/* Legend Overlay */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow text-xs space-y-1 z-[400] border">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Pickup Location</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500" /> Volunteer (En Route)</div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card/80 backdrop-blur border-white/10">
            <CardHeader>
              <CardTitle>Donation Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-white/10">
            <CardHeader>
              <CardTitle>Impact Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="donors">Donors</TabsTrigger>
            <TabsTrigger value="ngos">NGOs</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          </TabsList>

          <TabsContent value="donations">
            <Card className="bg-card/80 backdrop-blur border-white/10">
              <CardHeader>
                <CardTitle>Donation Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {donations.length === 0 ? (
                      <p className="text-center text-muted-foreground p-8">No donations found.</p>
                    ) : (
                      donations.map((donation) => (
                        <div key={donation.id} className="border p-4 rounded-lg flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50/50 dark:bg-gray-900/50">
                          <div>
                            <h3 className="font-semibold text-lg">{donation.food_type || "Food Donation"}</h3>
                            <p className="text-sm text-muted-foreground">
                              Qty: {donation.quantity} • From: {donation.address}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Donor: {donation.profiles?.full_name || "Unknown"}
                            </p>
                            <Badge className="mt-2" variant={
                              donation.status === 'delivered' ? 'verified' :
                                donation.status === 'pending' ? 'pending' : 'default'
                            }>
                              {donation.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {donation.status === 'pending' && (
                              <>
                                <Button size="sm" variant="success" onClick={() => handleUpdateStatus(donation.id, 'approved')}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(donation.id, 'rejected')}>
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleDeleteDonation(donation.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Helper Component for User Lists */}
          {['donors', 'ngos', 'volunteers'].map((roleType) => (
            <TabsContent key={roleType} value={roleType}>
              <Card className="bg-card/80 backdrop-blur border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">Managed {roleType}</CardTitle>
                    <Badge variant="outline">{users.filter(u => u.role === roleType.slice(0, -1)).length} Total</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users.filter(u => u.role === roleType.slice(0, -1)).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No {roleType} found.</div>
                      ) : (
                        users.filter(u => u.role === roleType.slice(0, -1)).map(user => (
                          <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {user.full_name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{user.full_name}</p>
                                  {user.approved ? (
                                    <Badge variant="verified" className="text-xs h-5">Active</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs h-5 text-red-600 border-red-200 bg-red-50">Pending Approval</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  {user.phone || "No phone"} • {user.location || "No location"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Registered: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={user.approved ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleVerifyUser(user.id, !user.approved)}
                              >
                                {user.approved ? "Revoke Access" : "Grant Access"}
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(user.id)}>
                                <Ban className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
