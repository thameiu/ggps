"use client"
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import styles from "../forgot-password/ForgotPassword.module.css"; // Reusing styles

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:9000/auth/reset-password", {
        token,
        newPassword,
      });
      setMessage(response.data.message);
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "An error occurred.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.description}>Enter a new password below.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            className={styles.input}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className={styles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
}
