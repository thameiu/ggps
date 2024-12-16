import { Marker, Popup } from 'react-leaflet';
import axios, { AxiosError } from 'axios';
import { LatLngBounds } from 'leaflet';



export const fetchEvents = async (currentBounds: LatLngBounds | null, searchWord: string, setEvents: (events: any[]) => void) => {
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


export const getIconUrl = (category: string) => {
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