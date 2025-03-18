"use client";
import { useState } from 'react';
import styles from './signup.module.css';
import { useRouter } from "next/navigation";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: { target: { name: string; value: string; }; }) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  // Modify the signup function to generate and send a confirmation link with both tokens
const handleSubmit = async (e: { preventDefault: () => void }) => {
  e.preventDefault();
  setError(null);
  
  try {
    // Signup request
    const signupResponse = await fetch('http://localhost:9000/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!signupResponse.ok) {
      const { message } = await signupResponse.json();
      throw new Error(message || 'An error occurred during signup.');
    }
    
    // Login immediately to get JWT token
    const loginResponse = await fetch('http://localhost:9000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    if (!loginResponse.ok) {
      const { message } = await loginResponse.json();
      throw new Error(message || 'An error occurred during login.');
    }
    
    localStorage.clear();
    const { token } = await loginResponse.json();
    localStorage.setItem("token", token);

    // Redirect to the map page
    window.location.href = "/map";
  } catch (err: unknown) {
    if (err instanceof Error) {
      setError(err.message);
      console.error(err.message);
    } else {
      setError('An error occurred.');
      console.error('An unknown error occurred.');
    }
  }
};
  
  document.title = "GGPS - Log in";

  return (
    <div className={`flex ${styles.signup}`}>
      <div className={`flex-1 flex items-center justify-center ${styles.rightSide}`}>
        <div className="w-full max-w-md p-8 space-y-6 rounded-lg">
          <h2 className={`text-2xl font-semibold text-center text-white ${styles.title}`}>Sign Up</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-400"
                >
                  First Name:
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 mt-1 text-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ backgroundColor: "#010101" }}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-400"
                >
                  Last Name:
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 mt-1 text-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ backgroundColor: "#010101" }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-400"
              >
                Username:
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 mt-1 text-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ backgroundColor: "#010101" }}
              />
            </div>
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
                className="w-full px-4 py-2 mt-1 text-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ backgroundColor: "#010101" }}
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
                className="w-full px-4 py-2 mt-1 text-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ backgroundColor: "#010101" }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              style={{ backgroundColor: "#990000" }}
            >
              Sign Up
            </button>
          </form>
          {error && (
            <p className="mt-4 text-sm text-center text-red-500">{error}</p>
          )}
          <p className='text-center'>
            Already have an account? <a href='/login' className={styles.link}>Log in!</a>
          </p>
        </div>
      </div>
    </div>
  );
}