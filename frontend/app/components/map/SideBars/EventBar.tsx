"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Event } from "../../eventCard/types";
import styles from "./eventbar.module.css";
import { selectColor } from "../../eventCard/eventUtils";
import { useRouter } from "next/navigation";

export function EventBar() {
  const [isBarOpen, setIsBarOpen] = useState(false);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"signedUp" | "organized">("signedUp");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:9000/event/userEntries", {
          params: { token },
          headers: { Authorization: token },
        });
        setUserEvents(response.data.events);
        setOrganizedEvents(response.data.organizedEvents);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  const getBorderColor = (event: Event) => {
    let color: string | null = null;
    selectColor(event, (selectedColor) => {
      color = selectedColor;
    });
    return color;
  };

  const displayedEvents = (selectedCategory === "signedUp" ? userEvents : organizedEvents).filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <button
        className={styles.openBar}
        onClick={() => setIsBarOpen((prev) => !prev)}
        style={{ left: isBarOpen ? "310px" : "10px" }}
      >
        <img src="/images/event.png" width={35} height={35} />
      </button>

      <div className={styles.eventBar} style={{ left: isBarOpen ? 0 : "-300px" }}>
        <div className={styles.selectorContainer}>
          <label htmlFor="eventCategory" className={styles.selectorLabel}>Show:</label>
          <select
            id="eventCategory"
            className={styles.selector}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as "signedUp" | "organized")}
          >
            <option value="signedUp">Signed-Up Events</option>
            <option value="organized">Organized Events</option>
          </select>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <section>
          <h2 className={styles.eventBarSectionTitle}>
            {selectedCategory === "signedUp" ? "Signed-Up Events" : "Organized Events"}
          </h2>
          {displayedEvents.length > 0 ? (
            displayedEvents.map((event: Event) => (
              <div
                key={event.id}
                className={styles.eventCard}
                style={{ border: `2px solid ${getBorderColor(event)}` }}
              >
                <h3 className={styles.eventBarCardTitle}>{event.title}</h3>
                <p><strong>Location:</strong> {event.street}, {event.city}, {event.zipCode}</p>
                <p><strong>Begin:</strong> {new Date(event.beginDate).toLocaleString().slice(0, -3)}</p>
                <p><strong>End:</strong> {new Date(event.endDate).toLocaleString().slice(0, -3)}</p>
                <p><strong>Category:</strong> {event.category}</p>
                <p>
                  <a
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/event?id=${event.id}`);
                    }}
                  >
                    More Information
                  </a>
                </p>
              </div>
            ))
          ) : (
            <p>No {selectedCategory === "signedUp" ? "signed-up" : "organized"} events found.</p>
          )}
        </section>
      </div>
    </>
  );
}
