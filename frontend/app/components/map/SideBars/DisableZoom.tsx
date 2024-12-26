"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
interface DisableZoomProps {
    isPanelHovered: boolean; 
    setEvents?: (events: any[]) => void;
}

export default function DisableZoom({ isPanelHovered }: DisableZoomProps) {
    const map = useMap();

    useEffect(() => {
        if (isPanelHovered) {
            map.scrollWheelZoom.disable(); 
            map.doubleClickZoom.disable();
        } else {
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();

        }
    }, [isPanelHovered, map]);

    return null;
}
