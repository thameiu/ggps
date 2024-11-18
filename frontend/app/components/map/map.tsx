"use client"; // Ensure this is treated as a client component

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Use for Next.js 13+ App Router
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from "react-leaflet";
import styles from './map.module.css';
import L, { LatLngBounds } from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css"; // Leaflet default styles
import RightPanel from "./RightPanel";
import ReactDOM from "react-dom";

export default function MapComponent() {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [events, setEvents] = useState<any[]>([]); // Store events data
    const [loading, setLoading] = useState(true); // Show loading state
    const [isTokenValid, setIsTokenValid] = useState(true); // Track token validity
    const [bounds, setBounds] = useState<LatLngBounds | null>(null); // Store map bounds
    const [isPanelOpen, setIsPanelOpen] = useState(false); // Control panel visibility
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
                        headers: {
                            authorization: token,
                        },
                    }
                );

                if (verifyResponse.status !== 200) {
                    throw new Error("Invalid token");
                }

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
                {
                    headers: {
                        authorization: token,
                    },
                }
            );
            setEvents(eventsResponse.data.slice(0, 50)); // Songer à changer la limite - proposer à l'user ? ou mettre la limite dans le back
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    };

    useEffect(() => {
        if (bounds) {
            fetchEvents(bounds); 
        }
    }, [bounds]);

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                params: {
                    lat,
                    lon: lng,
                    format: "json",
                },
            });
            console.log(response.data);

            setAddress(response.data.display_name);
        } catch (error) {
            console.error("Failed to fetch address:", error);
        }
    };

    function LocationMarker() {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                reverseGeocode(e.latlng.lat, e.latlng.lng); // Fetch address
            },
        });

        return position === null ? null : (
            <Marker position={position}>
                <Popup>{address || "Fetching address..."}</Popup>
            </Marker>
        );
    }

    function BoundsFinder() {
        const map = useMapEvents({
            moveend() {
                const visibleBounds = map.getBounds();
                setBounds(visibleBounds); // Save to state
            },
        });
        return null;
    }

    function ZoomChecker() {
        const map = useMapEvents({
            zoomend() {
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
    
            ReactDOM.render(button, buttonContainer);
    
            const control = new L.Control({ position: "topright" });
            control.onAdd = () => buttonContainer;
            control.addTo(map);
    
            return () => {
                ReactDOM.unmountComponentAtNode(buttonContainer);
                control.remove();
            };
        }, [map]);
    
        return null;
    }
    

    if (loading) {
        return <div>Loading...</div>; // Display loading while checking the token
    }

    if (!isTokenValid) {
        return null; // Token is invalid, but it will be redirected to login
    }

    return (
        <>
            <RightPanel
                position={position}
                setIsPanelOpen={setIsPanelOpen}
                isPanelOpen={isPanelOpen}
                fetchEvents={fetchEvents}
                bounds={bounds}
                address={address}
            />
            <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                style={{ height: "100vh", width: "100%" }}
                maxBounds={[
                    [-90, -180], // Southwest corner
                    [90, 180], // Northeast corner
                ]}
                maxBoundsViscosity={1.0}
                minZoom={3}
                maxZoom={18}
            >
                <TileLayer
                    noWrap={true}
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <BoundsFinder />
                <ZoomChecker />
                <LocationMarker />
                <AddPanelButton />
                {events.map((event) => (
                    <Marker
                        key={event.id}
                        position={[event.latitude || 0, event.longitude || 0]} // Replace with event coordinates
                    >
                        <Popup>
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
