"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./profile.module.css";
import Loader from "../loader/loader";

interface ProfileData {
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
  eventsOrganized?: Array<{ id: number; name: string; date: string }>;
  eventsParticipated?: Array<{ id: number; name: string; date: string }>;
}

interface ProfileProps {
  username: string; 
}

const Profile: React.FC<ProfileProps> = ({ username }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    username: "",
    firstName: "",
    lastName: "",
    bio: "",
    eventsOrganized: [],
    eventsParticipated: [],
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoggedInUsername = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated.");

        const response = await axios.post(
          "http://localhost:9000/auth/verify-token",
          {},
          { headers: { Authorization: token } }
        );

        setLoggedInUsername(response.data.user.username);
      } catch (err) {
        console.error("Error verifying token:", err);
        setErrorMessage("Failed to verify user authentication.");
      }
    };

    fetchLoggedInUsername();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsFetchingProfile(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated.");

      const response = await axios.get(`http://localhost:9000/user/${username}`, {
        headers: { Authorization: token },
      });

      setProfileData(response.data);
      setFormData(response.data);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setErrorMessage("Failed to load profile data.");
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated.");

      const data = { ...formData, token };

      await axios.put(`http://localhost:9000/user`, data, {
        headers: { Authorization: token },
      });

      setSuccessMessage("Profile updated successfully!");
      setProfileData(formData);
      setEditMode(false);
    } catch (err) {
      console.error("Error saving profile data:", err);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  if (isFetchingProfile) {
    return <Loader />;
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.header}>
        {profileData?.username}'s Profile
      </h1>

      {profileData ? (
        <div className={styles.profileCard}>
          {editMode && loggedInUsername === username ? (
            <div className={styles.form}>
              <label>
                <span>Username:</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </label>

              <label>
                <span>First Name:</span>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </label>

              <label>
                <span>Last Name:</span>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </label>

              <label>
                <span>Bio:</span>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className={styles.textarea}
                />
              </label>

              <div className={styles.actions}>
                <button
                  onClick={handleSaveChanges}
                  className={styles.saveButton}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.details}>
              <p>
                <strong>Username:</strong> {profileData.username}
              </p>

              <p>
                <strong>First Name:</strong> {profileData.firstName || "N/A"}
              </p>
              <p>
                <strong>Last Name:</strong> {profileData.lastName || "N/A"}
              </p>
              <p>
                <strong>Bio:</strong> {profileData.bio || "No bio provided."}
              </p>

              {loggedInUsername === username && (
                <button
                  onClick={() => setEditMode(true)}
                  className={styles.editButton}
                >
                  Edit Profile
                </button>
              )}
            </div>
          )}

          <div className={styles.events}>
            <div>
              <h2>Events Organized</h2>
              {profileData.eventsOrganized?.length ? (
                <ul>
                  {profileData.eventsOrganized.map((event) => (
                    <li key={event.id}>
                      {event.name} - {event.date}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No events organized.</p>
              )}
            </div>

            <div>
              <h2>Events Participated</h2>
              {profileData.eventsParticipated?.length ? (
                <ul>
                  {profileData.eventsParticipated.map((event) => (
                    <li key={event.id}>
                      {event.name} - {event.date}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No events participated in.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p>No profile data found.</p>
      )}

      {successMessage && (
        <p className={styles.successMessage}>{successMessage}</p>
      )}
      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
    </div>
  );
};

export default Profile;
  