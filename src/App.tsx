import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DonorDashboard from "./pages/DonorDashboard";
import NgoDashboard from "./pages/NgoDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";

const queryClient = new QueryClient();

import LoginGateway from "./pages/LoginGateway";

// ... (imports remain)
function AuthRedirect() {
  const { user, role, isLoading } = useAuth();
  if (isLoading) return null;
  if (user && role) {
    const roleRoutes: Record<string, string> = {
      admin: "/admin/dashboard",
      donor: "/donor/dashboard",
      ngo: "/ngo/dashboard",
      volunteer: "/volunteer/dashboard",
    };
    return <Navigate to={roleRoutes[role] || "/"} replace />;
  }
  return <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Login Gateway */}
            <Route path="/login" element={<LoginGateway />} />
            <Route path="/auth" element={<AuthRedirect />} /> {/* Fallback */}

            {/* Strict Login Routes */}
            <Route path="/login/donor" element={<Auth forcedRole="donor" forcedMode="login" />} />
            <Route path="/login/ngo" element={<Auth forcedRole="ngo" forcedMode="login" />} />
            <Route path="/login/volunteer" element={<Auth forcedRole="volunteer" forcedMode="login" />} />
            <Route path="/login/admin" element={<Auth forcedRole="admin" forcedMode="login" />} />

            {/* Strict Signup Routes */}
            <Route path="/signup/donor" element={<Auth forcedRole="donor" forcedMode="register" />} />
            <Route path="/signup/ngo" element={<Auth forcedRole="ngo" forcedMode="register" />} />
            <Route path="/signup/volunteer" element={<Auth forcedRole="volunteer" forcedMode="register" />} />
            {/* No public signup for admin, but route exists for completeness if needed, or redirect to Login */}
            <Route path="/signup/admin" element={<Navigate to="/login/admin" />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Dashboard Routes */}
            <Route path="/donor/dashboard" element={<ProtectedRoute allowedRoles={["donor", "admin"]}><DonorDashboard /></ProtectedRoute>} />
            <Route path="/donor/settings" element={<ProtectedRoute allowedRoles={["donor", "admin"]}><Settings /></ProtectedRoute>} />

            <Route path="/ngo/dashboard" element={<ProtectedRoute allowedRoles={["ngo", "admin"]}><NgoDashboard /></ProtectedRoute>} />
            <Route path="/ngo/settings" element={<ProtectedRoute allowedRoles={["ngo", "admin"]}><Settings /></ProtectedRoute>} />

            <Route path="/volunteer/dashboard" element={<ProtectedRoute allowedRoles={["volunteer", "admin"]}><VolunteerDashboard /></ProtectedRoute>} />
            <Route path="/volunteer/settings" element={<ProtectedRoute allowedRoles={["volunteer", "admin"]}><Settings /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><Settings /></ProtectedRoute>} />

            {/* Redirect legacy routes if accessed directly */}
            <Route path="/donor" element={<Navigate to="/donor/dashboard" replace />} />
            <Route path="/ngo" element={<Navigate to="/ngo/dashboard" replace />} />
            <Route path="/volunteer" element={<Navigate to="/volunteer/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
