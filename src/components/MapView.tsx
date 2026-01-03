import { MapPin } from "lucide-react";

export function MapView() {
    return (
        <div className="w-full h-[300px] bg-muted/20 rounded-xl relative overflow-hidden border border-border flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center" />

            {/* Mock Pins */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <MapPin className="w-8 h-8 text-primary animate-bounce shadow-glow" />
                <div className="bg-card px-2 py-1 rounded shadow-lg text-xs font-bold mt-1">You</div>
            </div>

            <div className="absolute top-1/3 left-1/3 flex flex-col items-center opacity-70">
                <MapPin className="w-6 h-6 text-destructive" />
            </div>

            <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center opacity-70">
                <MapPin className="w-6 h-6 text-warning" />
            </div>

            <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur px-3 py-2 rounded-lg text-xs text-muted-foreground shadow-sm">
                Interactive Map Coming Soon
            </div>
        </div>
    );
}
