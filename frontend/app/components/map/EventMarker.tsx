import { Marker, Popup } from 'react-leaflet';
import axios, { AxiosError } from 'axios';
import { LatLngBounds } from 'leaflet';

interface FetchEventsProps {
    bounds: LatLngBounds | null;
    searchWord: string | null;
    category: string | null;
    setEvents: (events: any[]) => void;
    dateFilter?: boolean; 
    mapInstance?: L.Map;
}

export const fetchEvents = async ({
    bounds,
    searchWord,
    category,
    setEvents,
    dateFilter = true, 
}: FetchEventsProps) => {
    const token = localStorage.getItem("token");
    if (!token || !bounds) return;

    const getCookie = (name: string) => {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [key, value] = cookie.split("=");
            if (key === name) return decodeURIComponent(value);
        }
        return null;
    };

    const mostSearchedWord = getCookie("keyword");
    const mostSearchedCategory = getCookie("category");

    const recommend = searchWord || category ? false : true;

    let finalSearchWord = null;
    let finalCategory = null;

    if (recommend) {
        finalSearchWord = mostSearchedWord;
        finalCategory = mostSearchedCategory
    }
    else{
        finalSearchWord = searchWord;
        finalCategory = category;
    }


    try {
        const params = {
            latMin: bounds.getSouthWest().lat.toString(),
            longMin: bounds.getSouthWest().lng.toString(),
            latMax: bounds.getNorthEast().lat.toString(),
            longMax: bounds.getNorthEast().lng.toString(),
            ...(finalSearchWord && { searchWord: finalSearchWord }),
            ...(finalCategory && { category: finalCategory }),
            ...(recommend && { recommend: recommend }),
            ...(dateFilter && { pastEvents: dateFilter }),
        };

        const endpoint = "http://localhost:9000/event/";

        const eventsResponse = await axios.get(endpoint, {
            params,
            headers: { authorization: token },
        });

        let events = eventsResponse.data;

        if (!dateFilter) {
            const now = new Date();
            events = events.filter(
                (event: any) => new Date(event.beginDate) > now
            );
        }

        setEvents(events.slice(0, 100));
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