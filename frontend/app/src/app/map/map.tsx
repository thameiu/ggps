"use client"; // Ensure this is treated as a client component

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Use for Next.js 13+ App Router
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from "react-leaflet";
import L, { LatLngBounds } from "leaflet";
import axios from "axios";

export default function MapComponent() {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [events, setEvents] = useState<any[]>([]); // Store events data
    const [loading, setLoading] = useState(true); // Show loading state
    const [isTokenValid, setIsTokenValid] = useState(true); // Track token validity
    const [bounds, setBounds] = useState<LatLngBounds | null>(null); // Store map bounds
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login"); // Redirect to login if no token is found
            return;
        }

        const verifyToken = async () => {
            try {
                // Verify token
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

                setIsTokenValid(true); // Token is valid
            } catch (error) {
                setIsTokenValid(false); // Token is invalid
                router.push("/login"); // Redirect to login
            } finally {
                setLoading(false); // Set loading to false after verification
            }
        };

        verifyToken();
    }, [router]);

    const fetchEvents = async (currentBounds: LatLngBounds | null) => {
        const token = localStorage.getItem("token");
        if (!token || !currentBounds) return "damn";
        console.log(currentBounds);
        try {
            const eventsResponse = await axios.post(
                "http://localhost:9000/event/getInRadius",
                {
                    latMin: currentBounds.getSouthWest().lat>-90 ? currentBounds.getSouthWest().lat.toString() : '-90',
                    longMin: currentBounds.getSouthWest().lng>-180 ? currentBounds.getSouthWest().lng.toString() : '-180',
                    latMax: currentBounds.getNorthEast().lat<90 ? currentBounds.getNorthEast().lat.toString() : '90',
                    longMax: currentBounds.getNorthEast().lng<180 ? currentBounds.getNorthEast().lng.toString() : '180',
                },
                {
                    headers: {
                        authorization: token,
                    },
                }
            );
            if (eventsResponse.data.length > 50) {
                eventsResponse.data = eventsResponse.data.slice(0, 50);
            }
            setEvents(eventsResponse.data); 
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    };

    useEffect(() => {
        if (bounds) {
            fetchEvents(bounds); // Fetch events whenever bounds change
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
            setAddress(response.data.display_name);
            console.log("Address:", response.data.display_name);
        } catch (error) {
            console.error("Failed to fetch address:", error);
        }
    };

    function LocationMarker() {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                reverseGeocode(e.latlng.lat, e.latlng.lng); // Fetch address
                console.log("Coordinates:", e.latlng);
            },
        });

        return position === null ? null : (
            <Marker position={position}>
                <Popup>{address || "Fetching address..."}</Popup>
            </Marker>
        );
    }

    function BoundsLogger() {
        const map = useMapEvents({
            moveend() {
                // Get the visible bounds when the map stops moving
                const visibleBounds = map.getBounds();
                setBounds(visibleBounds); // Save to state
            },
        });
        return null;
    }

    function ZoomLogger() {
        const map = useMapEvents({
            zoomend() {
                const zoomLevel = map.getZoom();
                console.log("Current zoom level:", zoomLevel);
                // Trigger bounds update to fetch events
                setBounds(map.getBounds());
            },
        });
        return null;
    }

    if (loading) {
        return <div>Loading...</div>; // Display loading while checking the token
    }

    if (!isTokenValid) {
        return null; // Token is invalid, but it will be redirected to login
    }

    return (
        <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: "100vh", width: "100%" }}
            maxBounds={[
                [-90, -180], // Southwest corner
                [90, 180],   // Northeast corner
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
            <BoundsLogger />
            <ZoomLogger />
            <LocationMarker />

            {/* Display each event as a marker */}
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
    );
}
