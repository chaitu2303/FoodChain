import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, ArrowRight } from "lucide-react";

interface FoodListingCardProps {
  id: string;
  title: string;
  quantity: string;
  expiresIn: string;
  location: string;
  distance: string;
  type: string;
  urgency: "low" | "medium" | "high";
  donorName: string;
  image?: string;
  onAccept?: () => void;
}

export function FoodListingCard({
  title,
  quantity,
  expiresIn,
  location,
  distance,
  type,
  urgency,
  donorName,
  image,
  onAccept,
}: FoodListingCardProps) {
  const urgencyVariant = urgency === "high" ? "urgent" : urgency === "medium" ? "pending" : "verified";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="elevated" className="overflow-hidden group">
        {image && (
          <div className="relative h-40 overflow-hidden">
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 right-3">
              <Badge variant={urgencyVariant}>
                {urgency === "high" ? "Urgent" : urgency === "medium" ? "Soon" : "Fresh"}
              </Badge>
            </div>
          </div>
        )}
        <CardContent className="p-5 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1">
                {title}
              </h3>
              {!image && (
                <Badge variant={urgencyVariant} className="shrink-0">
                  {urgency === "high" ? "Urgent" : urgency === "medium" ? "Soon" : "Fresh"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">by {donorName}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{type}</Badge>
            <Badge variant="outline">{quantity}</Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-accent" />
              <span>Expires in {expiresIn}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="truncate">{location}</span>
              <span className="text-primary font-medium">({distance})</span>
            </div>
          </div>

          {onAccept && (
            <Button variant="hero" className="w-full" onClick={onAccept}>
              Accept Donation
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
