// LocationMarker.tsx
import React from "react";
import { Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import styles from "./map.module.css";

type LocationMarkerProps = {
    isPanelOpen: boolean;
    setPosition: React.Dispatch<React.SetStateAction<L.LatLng | null>>;
    positionRef: React.MutableRefObject<L.LatLng | null>;
    setAddress: React.Dispatch<React.SetStateAction<string | null>>;
    address: string;
};

const LocationMarker: React.FC<LocationMarkerProps> = ({
    isPanelOpen,
    setPosition,
    positionRef,
    setAddress,
    address,
}) => {
    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                params: { lat, lon: lng, format: "json" },
            });
            setAddress(response.data.display_name);
        } catch (error) {
            console.error("Failed to fetch address:", error);
        }
    };

    useMapEvents({
        click(e) {
            if (!isPanelOpen) {
                setPosition(null);
                positionRef.current = null;
                return;
            }

            const panel = document.querySelector(`.${styles.rightPanel}`);
            const button = document.querySelector(`.${styles.openForm}`);
            if (
                (panel && panel.contains(e.originalEvent.target as Node)) ||
                (button && button.contains(e.originalEvent.target as Node))
            ) {
                return;
            }

            const newPosition = e.latlng;
            setPosition(newPosition);
            positionRef.current = newPosition;
            reverseGeocode(newPosition.lat, newPosition.lng);
        },
    });

    return positionRef.current ? (
        <Marker
            position={positionRef.current}
            icon={L.icon({
                iconUrl: "/images/icons8-marker-90.png",
                iconSize: [40, 40],
                iconAnchor: [15, 35],
                popupAnchor: [0, -30],
            })}
        >
            <Popup>{address || "Fetching address..."}</Popup>
        </Marker>
    ) : null;
};

export default LocationMarker;






