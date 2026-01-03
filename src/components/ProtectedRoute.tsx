import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { PendingApproval } from "@/pages/PendingApproval";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "ngo" | "donor" | "volunteer")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading, isVerified } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin bypasses verification check to allow them to verify others
  // Check both state role and metadata role to be safe
  const isAdmin = role === 'admin' || user?.user_metadata?.role === 'admin';

  if (!isAdmin && !isVerified) {
    return <PendingApproval />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    const roleRoutes: Record<string, string> = {
      admin: "/admin/dashboard",
      ngo: "/ngo/dashboard",
      donor: "/donor/dashboard",
      volunteer: "/volunteer/dashboard",
    };
    return <Navigate to={roleRoutes[role] || "/"} replace />;
  }

  return <>{children}</>;
}
