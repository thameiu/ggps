"use client"; // Ensure this is treated as a client component

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use for Next.js 13+ App Router
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

export default function MapComponent() {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // To show loading state
    const [isTokenValid, setIsTokenValid] = useState(true); // Track token validity
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log("Token:", token);
        if (!token) {
            router.push('/login'); // Redirect to login if no token is found
            return;
        }

        // Verify the token with the backend
        const verifyToken = async () => {
            try {
                const response = await axios.post('http://localhost:9000/auth/verify-token', {}, {
                    headers: {
                        authorization: token,
                    },
                });

                if (response.status !== 200) {
                    throw new Error('Invalid token');
                }

                setIsTokenValid(true); // Token is valid
            } catch (error) {
                setIsTokenValid(false); // Token is invalid
                router.push('/login'); // Redirect to login
            } finally {
                setLoading(false); // Set loading to false after verification
            }
        };

        verifyToken();
    }, [router]);

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                params: {
                    lat,
                    lon: lng,
                    format: 'json',
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

    if (loading) {
        return <div>Loading...</div>; // Display loading while checking the token
    }

    if (!isTokenValid) {
        return null; // Token is invalid, but it will be redirected to login
    }

    return (
        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "100vh", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker />
        </MapContainer>
    );
}
