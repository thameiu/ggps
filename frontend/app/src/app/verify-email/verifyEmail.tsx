"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Loader from "../../../components/loader/loader";
import styles from "./verifyEmail.module.css";

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const jwt = searchParams.get("jwt");

  const [message, setMessage] = useState("Verifying...");
  const hasRequested = useRef(false); 

  useEffect(() => {
    if (!token || !jwt || hasRequested.current) return;
    hasRequested.current = true; 

    axios
      .get(`http://localhost:9000/auth/verify?token=${token}&jwt=${jwt}`)
      .then(() => {
        setMessage("✅ Email verified successfully!");
        // Store the JWT if not already stored
        if (!localStorage.getItem("token")) {
          localStorage.setItem("token", jwt);
        }
      })
      .catch(() => setMessage("❌ Invalid or expired verification link."));
  }, [token, jwt]); 


  return (
    <div className={styles.container}>
      <div className={styles.verifyEmail}>
        {message === "Verifying..." ? (
          <Loader />
        ) : (
          <div className={styles.messageContainer}>
            <h1>{message}</h1>
            {message.includes("successfully") && (
              <div className={styles.successActions}>
                <p>Your email has been verified. You can now access all features.</p>
                <button 
                  className={styles.continueButton}
                  onClick={() => window.location.href = "/map"}
                >
                  Continue to GGPS
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}