"use client"; // Ensure this is treated as a client component

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from "react-leaflet";
import L, { LatLngBounds, LatLng } from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css"; // Leaflet default styles
import RightPanel from "./RightPanel";
import { createRoot } from "react-dom/client";
import styles from "./map.module.css";

export default function MapComponent() {
    const [position, setPosition] = useState<LatLng | null>(null);
    const positionRef = useRef<LatLng | null>(null); 
    const [address, setAddress] = useState<string | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(true);
    const [bounds, setBounds] = useState<LatLngBounds | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const verifyToken = async () => {
            try {
                const verifyResponse = await axios.post(
                    "http://localhost:9000/auth/verify-token",
                    {},
                    {
                        headers: { authorization: token },
                    }
                );

                if (verifyResponse.status !== 200) throw new Error("Invalid token");
                setIsTokenValid(true);
            } catch (error) {
                setIsTokenValid(false);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [router]);

    const fetchEvents = async (currentBounds: LatLngBounds | null) => {
        const token = localStorage.getItem("token");
        if (!token || !currentBounds) return;

        try {
            const eventsResponse = await axios.post(
                "http://localhost:9000/event/getInRadius",
                {
                    latMin: currentBounds.getSouthWest().lat.toString(),
                    longMin: currentBounds.getSouthWest().lng.toString(),
                    latMax: currentBounds.getNorthEast().lat.toString(),
                    longMax: currentBounds.getNorthEast().lng.toString(),
                },
                { headers: { authorization: token } }
            );
            setEvents(eventsResponse.data.slice(0, 50));
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    };

    useEffect(() => {
        if (bounds) fetchEvents(bounds);
    }, [bounds]);

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

    function LocationMarker() {
        useMapEvents({
            click(e) {

                const panel = document.querySelector(`.${styles.rightPanel}`);
                const button = document.querySelector(`.${styles.openForm}`);
                if (panel && panel.contains(e.originalEvent.target as Node) || button && button.contains(e.originalEvent.target as Node)) {
                    return; 
                }

                const newPosition = e.latlng;
                setPosition(newPosition);
                positionRef.current = newPosition; 
                reverseGeocode(newPosition.lat, newPosition.lng);
            },
        });

        return positionRef.current ? (
            <Marker position={positionRef.current}>
                <Popup>{address || "Fetching address..."}</Popup>
            </Marker>
        ) : null;
    }


    function BoundsFinder() {
        const map = useMapEvents({
            moveend() {
                setBounds(map.getBounds());
            },
        });
        return null;
    }

    function AddPanelButton() {
        const map = useMap();

        useEffect(() => {
            const buttonContainer = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            buttonContainer.style.cursor = "pointer";

            const button = (
                <button
                    className={styles.openForm}
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                >
                    Open Panel
                </button>
            );

            const root = createRoot(buttonContainer);
            root.render(button);

            const control = new L.Control({ position: "topright" });
            control.onAdd = () => buttonContainer;
            control.addTo(map);

            return () => {
                control.remove();
            };
        }, [map]);

        return null;
    }

    if (loading) return <div>Loading...</div>;

    if (!isTokenValid) return null;

    return (
        <>
            <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                style={{ height: "100vh", width: "100%" }}
                maxBounds={[
                    [-90, -180],
                    [90, 180],
                ]}
                maxBoundsViscosity={1.0}
                minZoom={3}
                maxZoom={18}
            >
                <RightPanel
                    position={positionRef.current}
                    setIsPanelOpen={setIsPanelOpen}
                    isPanelOpen={isPanelOpen}
                    fetchEvents={fetchEvents}
                    bounds={bounds}
                    address={address}
                />
                <TileLayer
                    noWrap
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <BoundsFinder />
                <LocationMarker />
                <AddPanelButton />
                {events.map((event) => (
                <Marker
                    key={event.id}
                    position={[event.latitude || 0, event.longitude || 0]}
                >
                    <Popup>
                        <button
                            onClick={async () => {
                                const token = localStorage.getItem("token");
                                if (!token) {
                                    alert("You must be logged in to sign up for events.");
                                    return;
                                }

                                try {
                                    const response = await axios.post(
                                        "http://localhost:9000/event/addEntry",
                                        { 
                                            eventId: event.id,
                                            email: localStorage.getItem("email"),
                                            status: "waiting",

                                         },
                                        { headers: { authorization: token } }
                                    );

                                    if (response.status === 200) {
                                        alert("Successfully signed up for the event!");
                                    } else {
                                        alert("Failed to sign up for the event.");
                                    }
                                } catch (error) {
                                    console.error("Error signing up for event:", error);
                                    alert("An error occurred. Please try again.");
                                }
                            }}
                        >
                            Sign up
                        </button>
                        <br />
                        <strong>{event.title}</strong>
                        <br />
                        {event.description}
                        <br />
                        Date: {event.beginDate}
                    </Popup>
                </Marker>
            ))}

            </MapContainer>
        </>
    );
}
