"use client"; // Ensure this is treated as a client component

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from "react-leaflet";
import L, { LatLngBounds, LatLng, map } from "leaflet";
import axios, { AxiosError } from "axios";
import "leaflet/dist/leaflet.css"; // Leaflet default styles
import RightPanel from "./SideBars/RightPanel";
import { createRoot } from "react-dom/client";
import styles from "./map.module.css";
import SearchBar from "./SearchBar";
import {EventBar

} from "./SideBars/EventBar";
import BoundsFinder from "./BoundsFinder";
import ModifyZoomButtons from "./ModifyZoomButtons";
import SimulateZoomOut from "./SimulateZoomOut";
import LocationMarker from "./LocationMarker";
import { fetchEvents, getIconUrl } from "./EventMarker";
import DisableScroll from "./SideBars/DisableScroll";

export default function MapComponent() {
    const [position, setPosition] = useState<LatLng | null>(null);
    const positionRef = useRef<LatLng | null>(null); 
    const [address, setAddress] = useState<string | null>(null);
    const [searchWord, setSearchWord] = useState<string | null>("");
    const [events, setEvents] = useState<any[]>([]); // State to hold events from SearchBar
    const [loading, setLoading] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(true);
    const [bounds, setBounds] = useState<LatLngBounds | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [hasZoomedOutOnce, setHasZoomedOutOnce] = useState(false); // Track zoom-out state
    const [isChatOpen, setIsChatOpen] = useState(false); // State for ChatroomBar
    const [isPanelHovered, setIsPanelHovered] = useState(false); // Track if mouse is over the div

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

    useEffect(() => {
        fetchEvents({ bounds, searchWord, setEvents });
    }, [bounds, searchWord]);

    if (loading) return <div>Loading...</div>;
 
    return (
        <>
            <MapContainer
                center={[46.58529425166958, 2.7246093750000004]}
                zoom={7}
                style={{ height: "100vh", width: "100%" }}
                maxBounds={[
                    [-90, -180],
                    [90, 180],
                ]}
                maxBoundsViscosity={1.0}
                minZoom={3}
                maxZoom={18}
                scrollWheelZoom={isPanelHovered ? false : true}
            >
                <DisableScroll isPanelHovered={isPanelHovered} />
                <RightPanel
                    position={positionRef.current}
                    setIsPanelOpen={setIsPanelOpen}
                    isPanelOpen={isPanelOpen}
                    bounds={bounds}
                    address={address}
                />


                <div
                onMouseEnter={() => setIsPanelHovered(true)} 
                onMouseLeave={() => setIsPanelHovered(false)} 
                >

                <EventBar/>
                </div>
                
    
                <SearchBar
                    coordinates={{
                        latMin: bounds?.getSouthWest().lat || 0,
                        longMin: bounds?.getSouthWest().lng || 0,
                        latMax: bounds?.getNorthEast().lat || 0,
                        longMax: bounds?.getNorthEast().lng || 0,
                    }}
                    onResultsFound={(foundEvents) => setEvents(foundEvents)}
                    onSearch={(searchTerm) => setSearchWord(searchTerm)}
                />
                <TileLayer
                    noWrap
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <BoundsFinder setBounds={setBounds} />
                
                <LocationMarker
                    isPanelOpen={isPanelOpen}
                    setPosition={setPosition}
                    positionRef={positionRef}
                    setAddress={setAddress}
                    address={address || ""}
                />
    
                <ModifyZoomButtons />
                {events.map((event) => (
                    <Marker
                        key={event.id}
                        icon={L.icon({
                            iconUrl: getIconUrl(event.category),
                            iconSize: [26.3, 32.42],
                            iconAnchor: [10, 30],
                            popupAnchor: [0, -30],
                        })}
                        position={[event.latitude || 0, event.longitude || 0]}
                        eventHandlers={{
                            mouseover: (event) => event.target.openPopup(),
                        }}
                    >
                        <Popup className={styles.eventPopup}>
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
                                                token: localStorage.getItem("token"),
                                                status: "waiting",
                                            },
                                            { headers: { authorization: token } }
                                        );
    
                                        if (response.status === 200) {
                                            alert("Successfully signed up for the event!");
                                        } else if (response.statusText === 'This user has already signed up for this event') {
                                            alert("Failed to sign up for the event.");
                                        } else {
                                            alert(response.statusText);
                                        }
                                    } catch (error: AxiosError | unknown) {
                                        if (axios.isAxiosError(error) && error.code === 'ERR_BAD_REQUEST') {
                                            alert("You have already signed up for this event.");
                                            return;
                                        }
    
                                        alert("An error occurred. Please try again.");
                                        console.error("Error signing up for event:", error);
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
                            <br />
                            <a href={`/event?id=${event.id}`}>More Information</a>
                        </Popup>
                    </Marker>
                ))}
                <SimulateZoomOut />
            </MapContainer>
        </>
    );
}    