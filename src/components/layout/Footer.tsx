import { Link } from "react-router-dom";
import { Leaf, Mail, Phone, MapPin, Twitter, Facebook, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function Footer() {
  return <footer id="footer" className="bg-foreground text-background">
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/lovable-uploads/598a7ec5-8615-4137-b3aa-86d1aac8cbbe.jpg"
              alt="FoodChain Logo"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="text-xl font-bold font-display">
              Food<span className="text-primary-light">Chain</span>
            </span>
          </Link>
          <p className="text-background/70 text-sm leading-relaxed">
            Connecting surplus food with those who need it most.
            Together, we can eliminate hunger and reduce food waste across India.
          </p>
          <div className="flex items-center gap-3">
            {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => <a key={i} href="#" className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
              <Icon className="w-4 h-4" />
            </a>)}
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-display font-semibold text-lg mb-4">Stay Updated</h4>
          <p className="text-background/70 text-sm mb-4">
            Subscribe to our newsletter for impact reports and community stories.
          </p>
          <div className="flex flex-col gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-background/10 border-background/20 text-background placeholder:text-background/50 focus:border-primary-light"
            />
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Mobile App & Certifications */}
        <div>
          <h4 className="font-display font-semibold text-lg mb-4">Get the App</h4>
          <p className="text-background/70 text-sm mb-4">
            Manage donations and track volunteers on the go.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="h-12 justify-start gap-3 bg-background/5 border-background/20 hover:bg-background/10 text-background hover:text-white">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-6 w-auto" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] uppercase">Download on the</span>
                <span className="text-sm font-semibold">App Store</span>
              </div>
            </Button>
            <Button variant="outline" className="h-12 justify-start gap-3 bg-background/5 border-background/20 hover:bg-background/10 text-background hover:text-white">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="h-6 w-auto" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] uppercase">Get it on</span>
                <span className="text-sm font-semibold">Google Play</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-display font-semibold text-lg mb-4">Contact Us</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-background/70">
              <MapPin className="w-4 h-4 mt-1 text-primary-light shrink-0" />
              <span>Subbalakshmi Nagar, Dondaparthy, Visakhapatnam – 530016</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-background/70">
              <Phone className="w-4 h-4 text-primary-light shrink-0" />
              <span>+91 7288977131</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-background/70">
              <Mail className="w-4 h-4 text-primary-light shrink-0" />
              <span>hello@foodchain.in</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-background/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/50">
          <p>© 2026 FoodChain. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-background/80 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-background/80 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  </footer>;
}