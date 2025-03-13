"use client" 
import { useState } from "react";
import axios from "axios";
import styles from "./ForgotPassword.module.css"; // New CSS module

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post("http://localhost:9000/auth/request-password-reset", { email });
      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "An error occurred.");
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>Reset Password</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required 
            className={styles.input}
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        {message && <p className={styles.message}>{message}</p>}
        <br/>
      <p className='text-center'>Remember your password ? <a href='/login' className={styles.link}>Log in !</a></p>

      </div>
    </div>
  );
}
