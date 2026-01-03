import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Leaf,
  Home,
  Package,
  Users,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bike,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "donor" | "ngo" | "volunteer" | "admin";
}

const roleNavItems = {
  donor: [
    { icon: Home, label: "Dashboard", path: "/donor" },
    { icon: Package, label: "My Donations", path: "/donor" }, // Point to dashboard for now
    { icon: Settings, label: "Settings", path: "/donor/settings" },
  ],
  // Mapping NGO to Admin or removing it. Keeping it minimal for now to avoid errors if role exists.
  ngo: [
    { icon: Home, label: "Dashboard", path: "/ngo" },
    { icon: Settings, label: "Settings", path: "/ngo/settings" },
  ],
  volunteer: [
    { icon: Home, label: "Dashboard", path: "/volunteer" },
    { icon: Bike, label: "My Tasks", path: "/volunteer" }, // Point to dashboard
    { icon: Settings, label: "Settings", path: "/volunteer/settings" },
  ],
  admin: [
    { icon: Home, label: "Dashboard", path: "/admin?tab=donations" },
    { icon: Users, label: "Managed Donors", path: "/admin?tab=donors" },
    { icon: Building2, label: "Managed NGOs", path: "/admin?tab=ngos" },
    { icon: Bike, label: "Managed Volunteers", path: "/admin?tab=volunteers" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ],
};

import { useAuth } from "@/hooks/useAuth";

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navItems = roleNavItems[role];
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-sans">

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col bg-card border-r border-border transition-all duration-300",
        sidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="FoodChain"
              className="w-8 h-8 object-contain"
            />
            {sidebarOpen && (
              <span className="text-xl font-bold font-display">
                Food<span className="text-primary">Chain</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className={cn("w-full", sidebarOpen ? "justify-start" : "justify-center")}
            onClick={signOut}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", sidebarOpen ? "lg:pl-64" : "lg:pl-20")}>
        {/* Mobile Top Bar (Logo Only) */}
        <header className="lg:hidden h-14 flex items-center justify-center border-b border-border bg-card sticky top-0 z-40 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="FoodChain"
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold">Food<span className="text-primary">Chain</span></span>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-50 pb-safe">
        {navItems.slice(0, 4).map((item) => {
          // We limit to 4 items for mobile bottom bar to avoid crowding
          const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-current opacity-20")} />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              {/* Shorten label for mobile (e.g. "Managed Donors" -> "Managed") */}
            </Link>
          );
        })}
        <button
          onClick={signOut}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </div>
    </div>
  );
}
