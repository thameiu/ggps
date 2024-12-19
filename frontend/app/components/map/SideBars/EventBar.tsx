"use client"
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Event } from "../../eventCard/types";
import styles from "../map.module.css";

export function EventBar() {
  const [isBarOpen, setIsBarOpen] = useState(false);
  const [userEvents, setUserEvents] = useState([]);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [error, setError] = useState(null);
  
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
              className={styles.chatroomBar}
              style={{
                  left: isBarOpen ? 0 : "-300px",
                  transition: "left 0.3s ease-in-out",
                  zIndex: 1000,

              }}
          >

        {/* User Events */}

        <section>
        <h2 className="text-xl font-semibold mb-2">Signed-Up Events</h2>
        {userEvents.length > 0 ? (
          userEvents.map((event:Event) => (
            <div key={event.id} className="border rounded-lg p-4 mb-4 shadow">
              <h3 className="text-lg font-bold">{event.title}</h3>
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
              <p><a href={`/event?id=${event.id}`}>More Information</a></p>
            </div>

          ))
        ) : (
          <p>No signed-up events found.</p>
        )}
      </section>
      
      {/* Organized Events */}

      <section>
        <h2 className="text-xl font-semibold mb-2">Organized Events</h2>
        {organizedEvents.length > 0 ? (
          organizedEvents.map((event:Event) => (
            <div key={event.id} className="border rounded-lg p-4 mb-4 shadow">
              <h3 className="text-lg font-bold">{event.title}</h3>
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
              <p><a href={`/event?id=${event.id}`}>More Information</a></p>
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
