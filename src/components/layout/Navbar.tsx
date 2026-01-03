import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
const navLinks = [{
  name: "Home",
  path: "/"
}, {
  name: "How It Works",
  path: "/#how-it-works"
}, {
  name: "Impact",
  path: "/#impact"
}, {
  name: "About",
  path: "/#footer"
}];
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { role } = useAuth();
  return <header className="fixed top-0 left-0 right-0 z-50">
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img alt="FoodChain Logo" src="/lovable-uploads/2f5516c4-e621-4902-87fe-9a657204c1c3.png" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-xl font-bold font-display text-foreground">
              Food<span className="text-primary">Chain</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => <Link key={link.path} to={link.path} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200", location.pathname === link.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              {link.name}
            </Link>)}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {role ? (
              <Link to="/auth">
                <Button variant="hero" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="hero" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Toggle menu">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
          opacity: 0,
          height: 0
        }} animate={{
          opacity: 1,
          height: "auto"
        }} exit={{
          opacity: 0,
          height: 0
        }} transition={{
          duration: 0.2
        }} className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navLinks.map(link => <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={cn("block px-4 py-3 rounded-lg text-sm font-medium transition-all", location.pathname === link.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              {link.name}
            </Link>)}
            <div className="pt-4 space-y-2 border-t border-border">
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full">
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
              </Link>
              <Link to="/auth?mode=register" onClick={() => setIsOpen(false)}>
                <Button variant="hero" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>}
      </AnimatePresence>
    </nav>
  </header>;
}