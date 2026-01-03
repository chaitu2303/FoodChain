import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepCardProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  isActive?: boolean;
  delay?: number;
}

export function StepCard({ 
  number, 
  icon: Icon, 
  title, 
  description, 
  isActive = false,
  delay = 0 
}: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative flex items-start gap-4 p-6 rounded-2xl transition-all duration-300",
        isActive ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
      )}
    >
      <div className={cn(
        "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg",
        isActive 
          ? "bg-gradient-hero text-primary-foreground shadow-glow" 
          : "bg-muted text-muted-foreground"
      )}>
        {number}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Icon className={cn(
            "w-5 h-5",
            isActive ? "text-primary" : "text-muted-foreground"
          )} />
          <h3 className="font-display font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
