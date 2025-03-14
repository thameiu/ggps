"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import styles from './rightpanel.module.css';
import L from "leaflet"; 
import { fetchEvents } from "../EventMarker";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { userAgent } from "next/server";


type RightPanelProps = {
    position: L.LatLng | null;
    setIsPanelOpen: (open: boolean) => void;
    setPlaceFromAddress: (open: boolean) => void;
    placeFromAddress: boolean;
    setAddress: (address: string) => void;
    setPosition: (position: L.LatLng | null) => void;
    isPanelOpen: boolean;
    bounds: L.LatLngBounds | null;
    addNewEvent: (newEvent: any) => void; 
    isUserVerified: boolean;

};

export default function RightPanel({
    position,
    setIsPanelOpen,
    setPosition,
    setPlaceFromAddress,
    placeFromAddress,
    setAddress,
    isPanelOpen,
    bounds,
    addNewEvent,
    isUserVerified,
}: RightPanelProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [beginDate, setBeginDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [number, setNumber] = useState("");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [country, setCountry] = useState("");
    const [createChatroom, setCreateChatroom] = useState<boolean | null>(true);
    const [privateEvent, setPrivateEvent] = useState<boolean | null>(false);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validateAddress, setValidateAddress] = useState(false);
    const [isSubmitClicked, setIsSubmitClicked] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);

    useEffect(() => {
        const disabledUntil = localStorage.getItem("disabledUntil");
        if (disabledUntil) {
          const now = new Date().getTime();
          const disabledUntilTime = parseInt(disabledUntil, 10);
          if (now < disabledUntilTime) {
            setIsButtonDisabled(true);
            const timeout = disabledUntilTime - now;
            setTimeout(() => setIsButtonDisabled(false), timeout);
          }
        }
      }, []);

    useEffect(() => {
        if (position && !placeFromAddress) {
            const fetchAddressFromPosition = async () => {
                try {
                    const response = await axios.get(
                        `https://nominatim.openstreetmap.org/reverse?lat=${position.lat}&lon=${position.lng}&format=json`
                    );
                    const data = response.data;
                    if (data && data.address) {
                        setNumber(data.address.house_number || "");
                        setStreet(data.address.road || "");
                        setCity(data.address.city || data.address.town || "");
                        setZipCode(data.address.postcode || "");
                        setCountry(data.address.country || "");
                        setAddress(data.display_name || "");
                    } else {
                        setError("Failed to fetch address. Please try again.");
                    }
                } catch (error) {
                    console.error("Reverse geocoding failed:", error);
                    setError("Failed to fetch address. Please try again.");
                }
            };
            fetchAddressFromPosition();
        }
    }, [position]);

    const handleGeocodeAddress = async () => {
        try {
            const query = `${number} ${street}, ${city}, ${zipCode}, ${country}`.trim();
            if (!query) {
                setValidateAddress(false);
                return;
            }
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                    query
                )}&format=json`
            );
            if (response.data.length === 0) {
                setValidateAddress(false);
                setError("Address not found. Please check the details.");
                return;
            }
            const result = response.data[0];
            const newPosition = new L.LatLng(parseFloat(result.lat), parseFloat(result.lon));
            setAddress(result.display_name);
            setPosition(newPosition);
            setValidateAddress(true);
            setPlaceFromAddress(true);
            setError(null); 
        } catch (error) {
            console.error("Failed to geocode address:", error);
            setError("Failed to find address. Please try again.");
        }
    };

    useEffect(() => {
        const submitEvent = async () => {
            // Only proceed with submission if the submit button was clicked
            if (!isSubmitClicked) return;

            if (!validateAddress || !position) {
                setError("You must select a valid address and position.");
                return;
            }

            const token = localStorage.getItem("token");

            if (!token) {
                setError("You must be logged in to create an event.");
                return;
            }

            const now = new Date();
            const beginDateTime = new Date(beginDate);
            const endDateTime = new Date(endDate);

            if (beginDateTime < now) {
                setError("Begin date must be later than the current date and time.");
                return;
            }
            if (endDateTime < beginDateTime) {
                setError("End date must be later than the begin date.");
                return;
            }

            try {
                const response = await axios.post(
                    "http://localhost:9000/event",
                    {
                        title,
                        description,
                        category,
                        beginDate,
                        endDate,
                        latitude: position.lat.toString(),
                        longitude: position.lng.toString(),
                        street,
                        city,
                        zipCode,
                        country,
                        number,
                        game: "",
                        token: token,
                        createChatroom: createChatroom,
                        private: privateEvent,
                    },
                    {
                        headers: {
                            authorization: token,
                        },
                    }
                );

                if (response.status === 201) {
                    const newEvent = response.data; 
                    addNewEvent(newEvent); 
                    setSuccess(true);
                    setTitle("");
                    setDescription("");
                    setBeginDate("");
                    setEndDate("");
                    setError(null);
                    setIsPanelOpen(false);
                    if (bounds) {
                        fetchEvents({ bounds, searchWord: "", category: null, setEvents: () => {} });
                    }
                    setPosition(null);
                    const disabledUntil = new Date().getTime() + 15 * 60 * 1000; // 15 minutes in milliseconds
                    localStorage.setItem("disabledUntil", disabledUntil.toString());
                    setIsButtonDisabled(true);
              
                    // Re-enable after 15 minutes
                    setTimeout(() => setIsButtonDisabled(false), 15 * 60 * 1000);
                    setIsButtonDisabled(true);
                    
                }
            } catch (error) {
                console.error("Failed to create event:", error);
                setError("Failed to create the event. Please try again.");
            } 
            setIsSubmitClicked(false);
        };
 
        if (validateAddress && position && isSubmitClicked) {
            submitEvent();
        }
    }, [validateAddress, position, title, description, category, beginDate, endDate, street, city, zipCode, country, number, createChatroom, bounds, setIsPanelOpen, isSubmitClicked]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitClicked(true); 
        await handleGeocodeAddress();
    };
    if (!isUserVerified){
        return <>
            <button
            className={styles.openForm}
            style={{
                right: isPanelOpen ? "310px" : "10px",
            }}
            disabled={isButtonDisabled}
            title='You must verify your email to create an event. Check your inbox.'
        >
           <img 
                className={styles.openFormIcon}
                src= "images/lock.png"
                width={35}
                height={35}
       
            />
        </button>
        </>
    }
    return (
    <>
        <button
            className={styles.openForm}
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            style={{
                right: isPanelOpen ? "310px" : "10px",
            }}
            disabled={isButtonDisabled}
            title={
                isButtonDisabled && parseInt(localStorage.getItem('disabledUntil')!) !== null
                  ? `Button will be enabled in ${ Math.max(0, Math.ceil((parseInt(localStorage.getItem('disabledUntil')!) - new Date().getTime()) / 1000 / 60))} minutes`
                  : ""
              } 
        >
           <img 
                className={styles.openFormIcon}
                src= {isButtonDisabled ? "/images/timeout.png" : "/images/create.png"}
                width={35}
                height={35}
                style={{transform: isPanelOpen ? "rotate(-45deg)" : "rotate(0deg)"}}
       
            />
        </button>

        <div
            className={styles.rightPanel}
            style={{
                right: isPanelOpen ? 0 : "-300px",
            }}
        >
            <h3 className={styles.createFormTitle}>Create Event</h3>
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
                    <option className={styles.option} value="Event">Other category</option>

                </select>
                <div className={styles.addressContainer}>
                {/* Address inputs */}
                    <div className={styles.addressLine}>
                        <input
                            type="text"
                            placeholder="Number"
                            value={number}
                            className={styles.addressNumber}
                            onChange={(e) => setNumber(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Street"
                            value={street}
                            className={styles.street}
                            onChange={(e) => setStreet(e.target.value)}
                            required

                        />
                    </div>
                    <div className={styles.addressLine}>
                        <input
                            type="text"
                            placeholder="ZIP Code"
                            value={zipCode}
                            className={styles.addressNumber}
                            onChange={(e) => setZipCode(e.target.value)}
                            required

                        />
                        <input
                            type="text"
                            placeholder="City"
                            value={city}
                            className={styles.city}
                            onChange={(e) => setCity(e.target.value)}
                            required

                        />
                    </div>
                    <div className={styles.addressLine}>
                        <input
                            type="text"
                            placeholder="Country"
                            value={country}
                            className={styles.country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={handleGeocodeAddress}
                            className={styles.locateButton}
                        >
                            <FontAwesomeIcon icon={faLocationDot} />
                        </button>
                    </div>
                </div>
                <div className={styles.dateLine}>
                    <p className={styles.dateLabel}>From:</p>
                    <input
                        type="datetime-local"
                        value={beginDate}
                        onChange={(e) => setBeginDate(e.target.value)}
                        required
                        className={styles.dateInput}
                    />
                </div>
                <div className={styles.dateLine}>
                    <p className={styles.dateLabel}>To:</p>
                    <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className={styles.dateInput}
                    />
                </div>

                <label className={styles.createChatroomToggle}>
                    <input
                        type="checkbox"
                        checked={createChatroom ? true : false}
                        onChange={(e) => setCreateChatroom(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                    <span className={styles.sliderText}>Create chatroom</span>
                </label>

                <label className={styles.createChatroomToggle}>
                    <input
                        type="checkbox"
                        checked={privateEvent ? true : false}
                        onChange={(e) => setPrivateEvent(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                    <span className={styles.sliderText}>Private event</span>
                </label>

                <div className={styles.submitLine}>

                    <button
                        type="submit"
                        className={styles.submitButton}
                    >
                        Create Event
                    </button>
                </div>
            </form>
            {error && <p className={styles.error}>{error}</p>}

        </div>

    </>
    );
}
