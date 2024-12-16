"use client";

import { useState } from "react";
import axios from "axios";
import styles from './map.module.css';
import L from "leaflet"; 

export function ChatroomBar() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  console.log(isChatOpen);
  return (
      <>
          <button
              className={styles.openChat}
              onClick={() => setIsChatOpen((prev) => !prev)}
              style={{
                  left: isChatOpen ? "310px" : "10px",
              }}
          >
              {isChatOpen ? "Close Chat" : "Open Chat"}
          </button>

          <div
              className={styles.chatroomBar}
              style={{
                  left: isChatOpen ? 0 : "-300px",
                  transition: "left 0.3s ease-in-out",
                  zIndex: 1000,

              }}
          >
              <h3 className={styles.chatroomTitle}>Chatroom</h3>
              <div className={styles.chatContent}> {/* Placeholder for chat content */} </div>
          </div>
      </>
  );
}
