"use client";

import { useState } from "react";
import axios from "axios";
import styles from './map.module.css';
import L from "leaflet"; 

type RightPanelProps = {
    position: L.LatLng | null;
    setIsPanelOpen: (open: boolean) => void;
    isPanelOpen: boolean;
    fetchEvents: (bounds: L.LatLngBounds | null) => void;
    bounds: L.LatLngBounds | null;
    address: string | null;

};

export default function RightPanel({
    position,
    setIsPanelOpen,
    isPanelOpen,
    fetchEvents,
    bounds,
}: RightPanelProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [beginDate, setBeginDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [address, setAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        if (!token) {
            setError("You must be logged in to create an event.");
            return;
        }

        if (!position) {
            setError("You must select a location on the map.");
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:9000/event/create",
                {
                    title,
                    description,
                    beginDate,
                    endDate,
                    latitude: position.lat.toString(), // Use coordinates from LocationMarker
                    longitude: position.lng.toString(),
                    street: "a",
                    city: "a",
                    zipCode: "a",
                    country: "a",
                    number: "a",
                },
                {
                    headers: {
                        authorization: token,
                    },
                }
            );

            if (response.status === 201) {
                setSuccess(true);
                setTitle("");
                setDescription("");
                setBeginDate("");
                setError(null);
                setIsPanelOpen(false); // Close the panel after successful submission
                fetchEvents(bounds); // Refresh events on the map
            }
        } catch (error) {
            console.error("Failed to create event:", error);
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                right: isPanelOpen ? 0 : "-300px",
                width: "300px",
                height: "100%",
                backgroundColor: "#333",
                boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                transition: "right 0.3s ease-in-out",
                zIndex: 1000,
                padding: "20px",
                color: "#fff",
            }}
        >
            <h3>Create Event</h3>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>Event created successfully!</p>}
            <form onSubmit={handleSubmit} className={styles.createForm}>
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ display: "block", margin: "10px 0", padding: "5px", width: "100%" }}
                />
                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    style={{ display: "block", margin: "10px 0", padding: "5px", width: "100%" }}
                />
                <input
                    type="datetime-local"
                    value={beginDate}
                    onChange={(e) => setBeginDate(e.target.value)}
                    required
                    style={{ display: "block", margin: "10px 0", padding: "5px", width: "100%" }}
                />
                <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    style={{ display: "block", margin: "10px 0", padding: "5px", width: "100%" }}
                />
                <button
                    type="submit"
                    style={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        padding: "10px 15px",
                        cursor: "pointer",
                    }}
                >
                    Create Event
                </button>
            </form>
            <button
                onClick={() => setIsPanelOpen(false)}
                style={{
                    marginTop: "10px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    padding: "10px 15px",
                    cursor: "pointer",
                }}
            >
                Close
            </button>
        </div>
    );
}
