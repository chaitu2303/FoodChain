import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function Settings() {
    const { role, user, profile: initialProfile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        location: "",
    });

    useEffect(() => {
        if (initialProfile) {
            setFormData({
                full_name: initialProfile.full_name || "",
                phone: initialProfile.phone || "",
                location: initialProfile.location || "",
            });
        }
    }, [initialProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    location: formData.location,
                })
                .eq('user_id', user.id);

            if (error) throw error;

            toast({
                title: "Profile Updated",
                description: "Your settings have been saved successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role={role as any}>
            <div className="space-y-6">
                <h1 className="text-3xl font-display font-bold">Settings</h1>

                <Card className="bg-card/80 backdrop-blur-sm border-white/10 shadow-lg">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ""} disabled className="bg-muted/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Input value={role || ""} disabled className="capitalize bg-muted/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Update your name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Update your phone"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="City, State"
                            />
                            <p className="text-xs text-muted-foreground">This location will be used for pickups and deliveries.</p>
                        </div>

                        <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-white/10 shadow-lg">
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Theme settings are managed globally.</p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
