"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
interface DisableScrollProps {
    isPanelHovered: boolean; 
    setEvents?: (events: any[]) => void;
}

export default function DisableScroll({ isPanelHovered }: DisableScrollProps) {
    const map = useMap();

    useEffect(() => {
        if (isPanelHovered) {
            map.scrollWheelZoom.disable(); 
        } else {
            map.scrollWheelZoom.enable();
        }
    }, [isPanelHovered, map]);

    return null;
}
