"use client"; // Ensures this component is treated as a client component

import { useState } from "react";
import styles from "./login.module.css";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page reload
    setError(null); // Reset error state

    try {
      const response = await fetch("http://localhost:9000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error( "Invalid credentials.");
      }
      localStorage.clear();


      const { token } = await response.json(); // Get token from response
      localStorage.setItem("token", token); // Store token in localStorage

      window.location.href = "/map";

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message); // Set error message to be displayed
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  document.title = "GGPS - Log in";

  return (
    <div className={`flex ${styles.login}`}>

      <div className={`flex-1 flex items-center justify-center ${styles.rightSide}`}>
        <div className="w-full max-w-md p-8 space-y-6 rounded-lg">
          <h2 className={`text-2xl font-semibold text-center text-white ${styles.title}`}>Log in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-400"
          >
            Email:
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 mt-1 text-black border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-400"
          >
            Password:
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 mt-1 text-black border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          style={{
          backgroundColor: '#990000',
            }
          }
        >
          Log In
        </button>
          </form>
          {error && (
        <p className="mt-4 text-sm text-center text-red-500">{error}</p>
          )}
          <p className='text-center'>Forgot your password ? <a href='/forgot-password' className={styles.link}>Reset it here !</a></p>
          <p className='text-center'>Don't have an account ? <a href='/signup' className={styles.link}>Sign up !</a></p>

        </div>
      </div>
    </div>
  );
}
