"use client"; // Ensure this is treated as a client component

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from "react-leaflet";
import L, { LatLngBounds, LatLng } from "leaflet";
import axios, { AxiosError } from "axios";
import "leaflet/dist/leaflet.css"; // Leaflet default styles
import RightPanel from "./SideBars/RightPanel";
import { createRoot } from "react-dom/client";
import styles from "./map.module.css";
import SearchBar from "./SearchBar/SearchBar";
import { EventBar } from "./SideBars/EventBar";
import BoundsFinder from "./BoundsFinder";
import ModifyZoomButtons from "./ModifyZoomButtons";
import SimulateZoomOut from "./SimulateZoomOut";
import LocationMarker from "./LocationMarker";
import { fetchEvents, getIconUrl } from "./EventMarker";
import Image from "next/image";
import Loader from "../loader/loader";
import DisableZoom from "./SideBars/DisableZoom";

export default function MapComponent() {
    const [position, setPosition] = useState<LatLng | null>(null);
    const positionRef = useRef<LatLng | null>(null); 
    const [address, setAddress] = useState<string | null>(null);
    const [placeFromAddress, setPlaceFromAddress] = useState(false); 
    const [searchWord, setSearchWord] = useState<string | null>("");
    const [category, setCategory] = useState<string | null>("");
    const [dateFilter, setDateFilter] = useState<boolean>(false); 
    const [events, setEvents] = useState<any[]>([]); 
    const [loading, setLoading] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(true);
    const [bounds, setBounds] = useState<LatLngBounds | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [hasZoomedOutOnce, setHasZoomedOutOnce] = useState(false); 
    const [isChatOpen, setIsChatOpen] = useState(false); 
    const [isPanelHovered, setIsPanelHovered] = useState(false); 
    const [userCoordinates, setUserCoordinates] = useState<LatLng | null>(null);


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

                if (verifyResponse.status !== 200) 
                    throw new Error("Invalid token");
                
                if (verifyResponse.data.user.latitude && verifyResponse.data.user.longitude){
                    setUserCoordinates(new L.LatLng(verifyResponse.data.user.latitude, verifyResponse.data.user.longitude));

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

    useEffect(() => {
            fetchEvents({ bounds, searchWord, category, setEvents, dateFilter });
    }, [bounds, searchWord, category, dateFilter, isTokenValid]);

    const addNewEvent = (newEvent: any) => {
        setEvents((prevEvents) => [...prevEvents, newEvent]);
    };

    if (loading) 
        return (
            <Loader />
        );

    document.title = "Map";
    
    return (
        <>
            <MapContainer
                center={[userCoordinates?.lat ? userCoordinates.lat : 46.58529425166958, userCoordinates?.lng ? userCoordinates.lng : 2.457275390625]}
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
                <DisableZoom isPanelHovered={isPanelHovered} />

                <div
                    onMouseEnter={() => setIsPanelHovered(true)} 
                    onMouseLeave={() => setIsPanelHovered(false)} 
                >
                    <EventBar />
                    
                    <RightPanel
                        position={positionRef.current}
                        setIsPanelOpen={setIsPanelOpen}
                        setPosition={setPosition}
                        isPanelOpen={isPanelOpen}
                        bounds={bounds}
                        setAddress={setAddress}
                        setPlaceFromAddress={setPlaceFromAddress}
                        placeFromAddress={placeFromAddress}
                        addNewEvent={addNewEvent}
                    />

                    <SearchBar
                        coordinates={{
                            latMin: bounds?.getSouthWest().lat || 0,
                            longMin: bounds?.getSouthWest().lng || 0,
                            latMax: bounds?.getNorthEast().lat || 0,
                            longMax: bounds?.getNorthEast().lng || 0,
                        }}
                        onResultsFound={(foundEvents) => setEvents(foundEvents.splice(0,100))}
                        onSearch={(searchTerm) => setSearchWord(searchTerm)}
                        onCategoryChange={(selectedCategory) => setCategory(selectedCategory)}
                        onDateFilterToggle={(dateFilter) => setDateFilter(dateFilter)} 
                    />

                </div>



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
                    setPlaceFromAddress={setPlaceFromAddress}
                    placeFromAddress={placeFromAddress}
                />

                <ModifyZoomButtons />
                <style jsx global>{`
                
                    .leaflet-popup-content-wrapper {
                    background-color: rgba(0, 0, 0, 0.8);
                    color: #fff; 
                    border-radius: 25px;
                    padding: 10px;
                    border:none;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); 
                    }

                    .leaflet-popup-tip {
                    background-color: rgba(0, 0, 0, 0.8); 
                    }

                    
                    .leaflet-popup-close-button{
                        margin-top : 10px;
                        margin-right : 10px;
                    }

                    .leaflet-popup-close-button span{
                        color: #fff;
                    }


                `}</style>
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
                            <div className={styles.eventPopupTitle}>{event.title}</div>
                            <div className={styles.eventPopupDescription}>{event.description}</div>
                            
                            <br/>
                            <div className={styles.eventPopupDate}>
                                {new Date(event.beginDate).toLocaleDateString()+'  '+new Date(event.beginDate).toLocaleTimeString().slice(0,5)}
                                {' - '}        
                                {new Date(event.endDate).toLocaleDateString()+'  '+new Date(event.endDate).toLocaleTimeString().slice(0,5)}
                            </div>


                            <div className={styles.eventPopupLink}>
                                <a 
                                    style={{
                                        color:'#ba0000',
                                    }}
                                    onClick={(e) => {
                                    e.preventDefault();
                                    router.push(`/event?id=${event.id}`);
                                    }}
                                >
                                    Check event
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                <SimulateZoomOut />
            </MapContainer>
        </>
    );
}
