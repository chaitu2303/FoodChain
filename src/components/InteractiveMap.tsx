import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface InteractiveMapProps {
    markers?: Array<{
        id: string;
        position: [number, number];
        title: string;
        description?: string;
    }>;
    route?: {
        start: [number, number];
        end: [number, number];
        color?: string;
    };
    center?: [number, number];
    zoom?: number;
    className?: string;
}

export function InteractiveMap({
    markers = [],
    route,
    center = [17.6868, 83.2185], // Default to Visakhapatnam
    zoom = 13,
    className
}: InteractiveMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <Skeleton className={cn("w-full h-[300px] rounded-xl", className)} />;
    }

    return (
        <Card className={cn("overflow-hidden border-border shadow-md h-[300px] w-full", className)}>
            <div className="h-full w-full z-0 relative">
                <MapContainer
                    center={center}
                    zoom={zoom}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* User Location Marker (Mock) */}
                    <Marker position={center} icon={defaultIcon}>
                        <Popup>
                            You are here
                        </Popup>
                    </Marker>

                    {markers.map((marker, idx) => (
                        <Marker key={marker.id || idx} position={marker.position} icon={defaultIcon}>
                            <Popup>
                                <div className="font-semibold">{marker.title}</div>
                                {marker.description && <div className="text-sm">{marker.description}</div>}
                            </Popup>
                        </Marker>
                    ))}

                    {route && (
                        <Polyline
                            positions={[route.start, route.end]}
                            pathOptions={{ color: route.color || 'blue', weight: 4, dashArray: '10, 10' }}
                        />
                    )}
                </MapContainer>
            </div>
        </Card>
    );
}
