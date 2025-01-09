"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Event } from "../../eventCard/types";
import styles from "./eventbar.module.css";
import { selectColor } from "../../eventCard/eventUtils";
import { useRouter } from "next/navigation";

export function EventBar() {
  const [isBarOpen, setIsBarOpen] = useState(false);
  const [userEvents, setUserEvents] = useState([]);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [error, setError] = useState(null);
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

  return (
    <>
      <button
        className={styles.openChat}
        onClick={() => setIsBarOpen((prev) => !prev)}
        style={{
          left: isBarOpen ? "310px" : "10px",
        }}
      >
        {isBarOpen ? "Close Chat" : "Open Chat"}
      </button>

      <div
        className={styles.eventBar}
        style={{
          left: isBarOpen ? 0 : "-300px",
        }}
      >
        {/* User Events */}
        <section>
          <h2 className={styles.eventBarSectionTitle}>Signed-Up Events</h2>
          {userEvents.length > 0 ? (
            userEvents.map((event: Event) => (
              <div
                key={event.id}
                className={styles.eventCard}
                style={{
                  border: `2px solid ${getBorderColor(event)}`,
                }}
              >
                <h3 className={styles.eventBarCardTitle}>{event.title}</h3>
                <p>
                  <strong>Location:</strong> {event.street}, {event.city}, {event.zipCode}
                </p>
                <p>
                    <strong>Begin:</strong> {new Date(event.beginDate).toLocaleString().slice(0, -3)}
                </p>
                <p>
                  <strong>End:</strong> {new Date(event.endDate).toLocaleString().slice(0, -3)}
                </p>
                <p>
                  <strong>Category:</strong> {event.category}
                </p>
                <p>
                  <a 
                    style={{
                      cursor: 'pointer',
                    }}
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
            <p>No signed-up events found.</p>
          )}
        </section>

        {/* Organized Events */}
        <section>
          <h2 className={styles.eventBarSectionTitle} style={{marginTop:'13px'}}>Organized Events</h2>
          {organizedEvents.length > 0 ? (
            organizedEvents.map((event: Event) => (
              <div
                key={event.id}
                className={styles.eventCard}
                style={{
                  border: `2px solid ${getBorderColor(event)}`,
                }}
              >
                <h3 className={styles.eventBarCardTitle}>{event.title}</h3>
                <p>
                  <strong>Location:</strong> {event.street}, {event.city}, {event.zipCode}
                </p>
                <p>
                  <strong>Begin:</strong> {new Date(event.beginDate).toLocaleString()}
                </p>
                <p>
                  <strong>End:</strong> {new Date(event.endDate).toLocaleString()}
                </p>
                <p>
                  <strong>Category:</strong> {event.category}
                </p>
                <p>
                  <a
                  style={{
                    cursor: 'pointer',
                  }}
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
            <p>No organized events found.</p>
          )}
        </section>
      </div>
    </>
  );
}
