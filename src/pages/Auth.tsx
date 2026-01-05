import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Building2,
  ChefHat,
  Bike,
  ArrowRight,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Leaf,
  Loader2,
  Shield,
  Crosshair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "donor" | "ngo" | "volunteer" | "admin";

const roles = [
  {
    id: "donor" as UserRole,
    icon: ChefHat,
    title: "Food Donor",
    description: "Restaurant, caterer, or household"
  },
  {
    id: "volunteer" as UserRole,
    icon: Bike,
    title: "Volunteer",
    description: "Pickup & delivery"
  },
  {
    id: "ngo" as UserRole,
    icon: Building2,
    title: "NGO Partner",
    description: "Verified organization"
  },
  {
    id: "admin" as UserRole,
    icon: Building2,
    title: "Administrator",
    description: "Manage operations"
  },
];

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password min 6 chars"),
  phone: z.string().min(10, "Valid mobile required"),
  location: z.string().min(2, "Location text required"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

interface AuthProps {
  forcedRole?: UserRole;
  forcedMode?: "login" | "register";
}

export default function Auth({ forcedRole, forcedMode }: AuthProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = forcedMode || (searchParams.get("mode") === "register" ? "register" : "login");
  const initialRole = forcedRole || (searchParams.get("role") as UserRole) || "donor";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [roleState, setRoleState] = useState<UserRole>(initialRole);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    latitude: 0,
    longitude: 0 // Default 0 to detect if captured
  });

  const { signIn, signInWithOtp, verifyOtp, role: userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => { if (forcedMode) setMode(forcedMode); }, [forcedMode]);
  useEffect(() => { if (forcedRole) setRoleState(forcedRole); }, [forcedRole]);

  useEffect(() => {
    if (userRole) {
      const dashboardRoutes: Record<string, string> = {
        donor: "/donor/dashboard",
        ngo: "/ngo/dashboard",
        volunteer: "/volunteer/dashboard",
        admin: "/admin/dashboard"
      };
      navigate(dashboardRoutes[userRole] || "/");
    }
  }, [userRole, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setErrors(prev => ({ ...prev, [id]: "" }));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location: prev.location || "Current Location Detected"
        }));
        toast({ title: "Location Captured", description: "GPS coordinates saved." });
        setIsLoading(false);
      },
      (error) => {
        toast({ title: "Location Error", description: error.message, variant: "destructive" });
        setIsLoading(false);
      }
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    if (!formData.latitude || formData.latitude === 0) {
      toast({ title: "Location Required", description: "Please capture your live location.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      if (!otpSent) {
        const { error } = await signInWithOtp(formData.phone, {
          full_name: formData.name,
          role: roleState,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
        });

        if (error) throw error;

        toast({ title: "OTP Sent", description: `Code sent to ${formData.phone}` });
        setOtpSent(true);
      } else {
        const { error } = await verifyOtp(formData.phone, otp);
        if (error) throw error;

        // Double check updates (sometimes verifyOtp doesn't pass metadata properly in all flows)
        const { error: updateError } = await supabase.auth.updateUser({
          email: formData.email,
          password: formData.password,
          data: {
            full_name: formData.name,
            location: formData.location,
            role: roleState,
            latitude: formData.latitude,
            longitude: formData.longitude,
            first_login: true,
            mobile: formData.phone // Ensure strict mobile saving
          }
        });

        if (updateError) console.error("Profile update warning:", updateError);

        toast({ title: "Registration Successful", description: "Redirecting..." });
        // Navigation handled by auth effect
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const result = signInSchema.safeParse({ email: formData.email, password: formData.password });
      if (!result.success) {
        setErrors({ email: "Required", password: "Required" });
        setIsLoading(false);
        return;
      }

      const { error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      toast({ title: "Welcome back", description: "Signing in..." });
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    if (forcedMode && forcedRole) {
      const target = mode === 'login' ? `/signup/${forcedRole}` : `/login/${forcedRole}`;
      navigate(target);
    } else {
      setMode(mode === "login" ? "register" : "login");
    }
    setOtpSent(false); setOtp(""); setErrors({});
  };

  const getPortalTitle = () => {
    if (forcedRole === 'donor') return mode === 'login' ? "Donor Login" : "Donor Signup";
    if (forcedRole === 'ngo') return mode === 'login' ? "NGO Login" : "NGO Partner Signup";
    if (forcedRole === 'volunteer') return mode === 'login' ? "Volunteer Login" : "Volunteer Signup";
    if (forcedRole === 'admin') return mode === 'login' ? "Admin Login" : "Admin Usage Only";
    return mode === "login" ? "Welcome back" : "Create your account";
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="FoodChain" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold font-display text-foreground">Food<span className="text-primary">Chain</span></span>
          </Link>

          <Card variant="flat" className="border-0 shadow-none">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl font-display">
                {getPortalTitle()}
              </CardTitle>
              <CardDescription>
                {mode === "login" ? "Enter your credentials to access your account" : "Create an account to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">

              {/* Role Select for Generic Register */}
              {mode === 'register' && !forcedRole && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {roles.filter(r => r.id !== 'admin').map(r => (
                    <button key={r.id} onClick={() => setRoleState(r.id)}
                      type="button"
                      className={cn("p-3 rounded-xl border-2 text-center transition-all", roleState === r.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
                    >
                      <r.icon className={cn("w-6 h-6 mx-auto mb-2", roleState === r.id ? "text-primary" : "text-muted-foreground")} />
                      <p className="text-xs font-medium">{r.title}</p>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">

                {mode === 'register' && (
                  <>
                    <div className="space-y-2">
                      <Label>Full Name / Org Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input id="name" value={formData.name} onChange={handleInputChange} className="pl-10" placeholder="Enter name" />
                      </div>
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Mobile Number (For OTP)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input id="phone" value={formData.phone} onChange={handleInputChange} className="pl-10" placeholder="+91 9999999999" disabled={otpSent} />
                      </div>
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-10" placeholder="hello@example.com" />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} className="pl-10 pr-10" placeholder="•••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                {mode === 'register' && (
                  <div className="space-y-2">
                    <Label>Location (Mandatory)</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input id="location" value={formData.location} onChange={handleInputChange} className="pl-10" placeholder="City, Area" />
                      </div>
                      <Button type="button" variant="outline" size="icon" onClick={getLocation} title="Get Live Location" className={cn(formData.latitude !== 0 && "bg-green-100 border-green-500 text-green-700")}>
                        <Crosshair className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.latitude !== 0 && <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><Leaf className="w-3 h-3" /> GPS Captured ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})</p>}
                    {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                  </div>
                )}

                {mode === 'register' && otpSent && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2">
                    <Label>Enter Verification Code</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" className="pl-10 text-center text-lg tracking-widest" maxLength={6} />
                    </div>
                  </motion.div>
                )}

                <div className="pt-2">
                  <Button type="submit" size="lg" className="w-full" variant="hero" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {mode === 'login' ? "Sign In" : otpSent ? "Verify & Create Account" : "Send OTP"}
                  </Button>
                </div>

              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">{mode === 'login' ? "New here?" : "Already valid?"}</span>
                <button type="button" onClick={toggleMode} className="ml-2 text-primary font-medium hover:underline">
                  {mode === 'login' ? "Create Account" : "Login"}
                </button>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full"><defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#g)" /></svg>
        </div>
        <div className="relative z-10 text-center text-primary-foreground max-w-lg">
          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-8">
            <Leaf className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-display font-bold mb-6">Empower Your Community</h2>
          <p className="text-lg opacity-90 leading-relaxed">Join the movement to reduce food waste. Whether you donations, volunteers, or NGOs, everyone plays a vital role.</p>
        </div>
      </div>
    </div>
  );
}
