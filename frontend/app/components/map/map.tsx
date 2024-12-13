"use client"; // Ensure this is treated as a client component

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from "react-leaflet";
import L, { LatLngBounds, LatLng, map } from "leaflet";
import axios, { AxiosError } from "axios";
import "leaflet/dist/leaflet.css"; // Leaflet default styles
import RightPanel from "./RightPanel";
import { createRoot } from "react-dom/client";
import styles from "./map.module.css";
import SearchBar from "./SearchBar";

export default function MapComponent() {
    const [position, setPosition] = useState<LatLng | null>(null);
    const positionRef = useRef<LatLng | null>(null); 
    const [address, setAddress] = useState<string | null>(null);
    const [searchWord, setSearchWord] = useState<string | null>(null);
    const [events, setEvents] = useState<any[]>([]); // State to hold events from SearchBar
    const [loading, setLoading] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(true);
    const [bounds, setBounds] = useState<LatLngBounds | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [hasZoomedOutOnce, setHasZoomedOutOnce] = useState(false); // Track zoom-out state
    

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
            if (searchWord && searchWord.length >= 3){
                const eventsResponse = await axios.get(
                    "http://localhost:9000/event/getBySearchWordInRadius",
                    {
                        params: {
                            latMin: currentBounds.getSouthWest().lat.toString(),
                            longMin: currentBounds.getSouthWest().lng.toString(),
                            latMax: currentBounds.getNorthEast().lat.toString(),
                            longMax: currentBounds.getNorthEast().lng.toString(),
                            searchWord: searchWord,
                        },
                        headers: { authorization: token }
                    },
                );
                setEvents(eventsResponse.data.slice(0, 50));
            } else {
                const eventsResponse = await axios.get(
                    "http://localhost:9000/event/getInRadius",
                    {
                        params: {
                            latMin: currentBounds.getSouthWest().lat.toString(),
                            longMin: currentBounds.getSouthWest().lng.toString(),
                            latMax: currentBounds.getNorthEast().lat.toString(),
                            longMax: currentBounds.getNorthEast().lng.toString(),
                        },
                        headers: { authorization: token }
                    },
                );
                setEvents(eventsResponse.data.slice(0, 50));
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    };

    useEffect(() => {
        if (bounds) fetchEvents(bounds);
    }, [bounds]);

    const reverseGeocode = async (lat: number, lng: number) => {
        console.log(lat, lng);
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

                if (!isPanelOpen) {
                    setPosition(null);
                    positionRef.current = null; 

                    return;
                }

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
            <Marker position={positionRef.current}
            icon={L.icon({
                iconUrl: '/images/icons8-marker-90.png',
                iconSize: [40, 40], 
                iconAnchor: [15, 35], 
                popupAnchor: [0, -30] 
            })}
            >
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
            
            const existingButtons = document.querySelectorAll(`.${styles.openForm}`);
            if (existingButtons.length > 1) {
                existingButtons.forEach((button, index) => {
                    if (index > 0) {
                        button.parentElement?.removeChild(button);
                    }
                });
                return; 
            }
    
            if (existingButtons.length === 1) {
                console.log(existingButtons[0]);
                return;
            }
    
            const buttonContainer = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            buttonContainer.style.cursor = "pointer";
            buttonContainer.style.top = "12vh";
            buttonContainer.style.border = "none";
    
            const button = (
                <button
                    id="openFormButton"
                    className={styles.openForm}
                    onClick={() => setIsPanelOpen((prev) => !prev)}
                >
                    Open Panel
                </button>
            );
            
            const root = createRoot(buttonContainer);
            root.render(button);
    
            const control = new L.Control({ position: "topright" });
            control.onAdd = () => buttonContainer;
            control.addTo(map);
        }, [map]); 
    
        return null;
    }
    

    function ModifyZoomButtons() {
        const map = useMap();
    
        useEffect(() => {
            // Select the zoom control container dynamically
            const zoomControl = document.querySelector(".leaflet-control-zoom") as HTMLElement;
            const zoomInControl = document.querySelector(".leaflet-control-zoom-in") as HTMLElement;
            const zoomOutControl = document.querySelector(".leaflet-control-zoom-out") as HTMLElement;

            if (zoomControl) {
                zoomControl.style.top = "12vh"; 
                zoomControl.style.right = "10wh";
                zoomControl.style.backgroundColor = "#111";
                zoomInControl.style.backgroundColor = "#111";
                zoomInControl.style.color = "#fff";
                zoomOutControl.style.backgroundColor = "#111";
                zoomOutControl.style.color = "#fff"; 
            }
        }, [map]);
    
        return null;
    }

    function SimulateZoomOut() {
        const map = useMap();

        useEffect(() => {
            if (map && !hasZoomedOutOnce) {
                const currentZoom = map.getZoom();
                map.setZoom(currentZoom - 1, { animate: true });
                setHasZoomedOutOnce(true); 
            }
        }, [map, hasZoomedOutOnce]);
    
        return null;
    }


    if (loading) return <div>Loading...</div>;
    const existingButtons = document.querySelectorAll(`.${styles.openForm}`);
    if (existingButtons.length > 1) {

        existingButtons.forEach((button, index) => {
            if (index > 0) {
                button.parentElement?.removeChild(button);
            }
        });
        return; 
    }

    
                

                
    const getIconUrl = (category: string) => {
        switch (category.toLocaleLowerCase()) {
            case "tournament":
                return "/images/tournament-marker.png";
            case "lan":
                return "/images/lan-marker.png";
            case "convention":
                return "/images/convention-marker.png";
            case "speedrunning event":
                return "/images/speedrun-marker.png";    
            case "esport event":
                return "/images/esport-marker.png"; 
            default:
                return "/images/event-marker.png";
        }
    };


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
            >
                
                <AddPanelButton />

                <RightPanel
                    position={positionRef.current}
                    setIsPanelOpen={setIsPanelOpen}
                    isPanelOpen={isPanelOpen}
                    fetchEvents={fetchEvents}
                    bounds={bounds}
                    address={address}
                />
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
                {/* var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
                    minZoom: 0,
                    maxZoom: 20,
                    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    ext: 'png'
                    }); */}

                {/* <TileLayer
                    noWrap
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                /> */}

                <BoundsFinder />
                <LocationMarker />
                
                <ModifyZoomButtons />
                {events.map((event) => (
                    
                    <Marker
                        key={event.id}
                        icon={L.icon({
                            iconUrl: getIconUrl(event.category),
                            iconSize: [26.3, 32.42], 
                            iconAnchor: [15, 30], 
                            popupAnchor: [0, -30] 
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
                                        } else if (response.statusText === 'This user has already signed up for this event'){
                                            alert("Failed to sign up for the event.");
                                        } else {
                                            alert(response.statusText);
                                        }
                                    } catch (error:AxiosError|unknown) {
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
            <SimulateZoomOut/>
            </MapContainer>
        </>
    );
}
