import { Marker, Popup } from 'react-leaflet';
import axios, { AxiosError } from 'axios';
import { LatLngBounds } from 'leaflet';
import { useEffect } from 'react';
import { AsyncResource } from 'node:async_hooks';

interface FetchEventsProps {
    bounds: LatLngBounds | null;
    searchWord: string | null;
    category: string | null;
    setEvents: (events: any[]) => void;
    dateFilter?: boolean;
    mapInstance?: L.Map;
    zoomLevel?: number;
}

export const fetchEvents = async ({
    bounds,
    searchWord,
    category,
    setEvents,
    dateFilter = true,
    zoomLevel = 10,
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

    let finalSearchWord = searchWord;
    let finalCategory = category;
    let recommend = false;

    if (!searchWord && mostSearchedWord) {
        finalSearchWord = mostSearchedWord;
        recommend = true;
    }

    if (!category && mostSearchedCategory) {
        if (!searchWord){
            finalCategory = mostSearchedCategory;
        }
        recommend = true;

    }

    if (category || searchWord) {
        recommend = false;

    }

    const storedEvents = JSON.parse(localStorage.getItem("fetchedEvents") || "[]");
    let filteredEvents = storedEvents.filter((event: any) => {
        const eventLatLng = [event.latitude, event.longitude];
        return bounds.contains(eventLatLng);
    });

    if (finalSearchWord && !recommend) {
        filteredEvents = filteredEvents.filter((event: any) =>
            event.title.toLowerCase().includes(finalSearchWord.toLowerCase())
        );
    }

    if (finalCategory && !recommend) {
        filteredEvents = filteredEvents.filter(
            (event: any) => event.category.toLowerCase() === finalCategory.toLowerCase()
        );
    }

    if (!dateFilter) {
        const now = new Date();
        filteredEvents = filteredEvents.filter(
            (event: any) => new Date(event.beginDate) > now
        );
    }

    if (filteredEvents.length < 5 && zoomLevel < 10) {

        await fetchAndStoreEvents({
            bounds,
            searchWord: finalSearchWord,
            category: finalCategory,
            setEvents,
            dateFilter,
            recommend,
            token,
        });
    } else {
        setEvents(filteredEvents.slice(0, 150));
    }
};


export const fetchAndStoreEvents = async ({
    bounds,
    searchWord,
    category,
    setEvents,
    dateFilter,
    recommend,
    token,
}: {
    bounds: LatLngBounds | null;
    searchWord: string | null;
    category: string | null;
    setEvents: (events: any[]) => void;
    dateFilter?: boolean;
    recommend: boolean;
    token: string;
}) => {
    try {
        const params: any = {
            latMin: bounds?.getSouthWest().lat.toString(),
            longMin: bounds?.getSouthWest().lng.toString(),
            latMax: bounds?.getNorthEast().lat.toString(),
            longMax: bounds?.getNorthEast().lng.toString(),
            ...(searchWord && { searchWord }),
            ...(category && { category }),
            ...(recommend && { recommend }),
            ...(dateFilter && { pastEvents: dateFilter }),
        };
        
        const endpoint = "http://localhost:9000/event/";

        const eventsResponse = await axios.get(endpoint, {
            params,
            headers: { authorization: token },
        });

        let events = eventsResponse.data;

        // Store the fetched events in localStorage
        localStorage.setItem("fetchedEvents", JSON.stringify(events));

        setEvents(events.slice(0, 1000)); // Update the state with fetched events
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