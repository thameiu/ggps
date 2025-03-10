"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Loader from "../../../components/loader/loader";
import styles from "./verifyEmail.module.css";

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [message, setMessage] = useState("Verifying...");
  const hasRequested = useRef(false); 

  useEffect(() => {
    if (!token || hasRequested.current) return;
    hasRequested.current = true; 

    axios
      .get(`http://localhost:9000/auth/verify?token=${token}`)
      .then(() => setMessage("✅ Email verified successfully!"))
      .catch(() => setMessage("❌ Invalid or expired token."));
  }, [token]); 


  return (
    <div className={styles.container}>
      <div className={styles.verifyEmail}>
        {message == "Verifying..." ? (
          <Loader />
        ) : (
          <h1>{message}</h1>
        )
        }
      </div>
    </div>
  );
}
