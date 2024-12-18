"use client";

import { useState } from "react";
import axios from "axios";
import styles from '../map.module.css';
import L from "leaflet"; 
import { fetchEvents } from "../EventMarker";

type RightPanelProps = {
    position: L.LatLng | null;
    setIsPanelOpen: (open: boolean) => void;
    isPanelOpen: boolean;
    bounds: L.LatLngBounds | null;
    address: string | null;

};

export default function RightPanel({
    position,
    setIsPanelOpen,
    isPanelOpen,
    bounds,
}: RightPanelProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [beginDate, setBeginDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [address, setAddress] = useState<string | null>(null);
    const [createChatroom, setCreateChatroom] = useState<boolean | null>(true);
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
                    category,
                    beginDate,
                    endDate,
                    latitude: position.lat.toString(),
                    longitude: position.lng.toString(),
                    street: "a",
                    city: "a",
                    zipCode: "a",
                    country: "a",
                    number: "a",
                    game: "",
                    token: token,
                    createChatroom: createChatroom,
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
                setEndDate("");
                setError(null);
                setIsPanelOpen(false);
                if (bounds) {
                    console.log("eefhdghudfhduehdeidjfhdeujfd")
                    fetchEvents({ bounds, searchWord: "", setEvents: () => {} });
                }
            }
        } catch (error) {
            console.error("Failed to create event:", error);
        }
    };

    return (
    <>
        <button
            className={styles.openForm}
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            style={{
                right: isPanelOpen ? "310px" : "10px",
            }}
        >
            {isPanelOpen ? "Close Panel" : "Create Event"}
        </button>

        <div className={styles.rightPanel}
            style={{
                right: isPanelOpen ? 0 : "-300px",
            }}
        >
            <h3 className={styles.createFormTitle}>Create Event</h3>
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
                <select
                    className={styles.select}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    style={{ display: "block", margin: "10px 0", padding: "5px", width: "100%" }}
                >
                    <option value="" disabled>Select Category</option>
                    <option className={styles.option} value="Lan">Lan</option>
                    <option className={styles.option} value="Tournament">Tournament</option>
                    <option className={styles.option} value="Convention">Convention</option>
                    <option className={styles.option} value="Esport Event">E-sport Event</option>
                    <option className={styles.option} value="Speedrunning event">Speedrunning Event</option>

                </select>
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
                
                <label className={styles.checkbox} >
                    <div className={styles.checkLabel}>Create chatroom</div>

                    <input
                        className={styles.checkInput}
                        checked={createChatroom?true:false}
                        onChange={(e) => setCreateChatroom(e.target.checked)}

                        type="checkbox"
                        name="isOnline"
                        style={{ display: "block", margin: "10px 0", padding: "5px", width: "100%" }}
                    />
                </label>

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
                className={styles.closeForm}

            >
                Close
            </button>
        </div>
    </>
    );
}