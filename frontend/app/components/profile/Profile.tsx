"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./profile.module.css";
import Loader from "../loader/loader";

interface ProfileData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
}

const Profile: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const fetchProfileData = async () => {
    try {
      setIsFetchingProfile(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated.");

      const response = await axios.get("http://localhost:9000/user", {
        params: {
          token: token,
        },
        headers: {
          Authorization: token,
        },
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

      // Include the token in both the request body and headers
      const data = { ...formData, token };

      await axios.put("http://localhost:9000/user", data, {
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
  }, []);

  if (isFetchingProfile) {
    return <Loader />;
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.header}>My Profile</h1>

      {isFetchingProfile ? (
        <Loader /> // Replace "Loading profile data..." with your Loader component
      ) : profileData ? (
        <div className={styles.profileCard}>
          {editMode ? (
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
                <span>Email:</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
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
                <strong>Email:</strong> {profileData.email}
              </p>
              <p>
                <strong>First Name:</strong> {profileData.firstName || "John"}
              </p>
              <p>
                <strong>Last Name:</strong> {profileData.lastName || "Doe"}
              </p>
              <p>
                <strong>Bio:</strong> {profileData.bio || "No bio provided."}
              </p>

              <button
                onClick={() => setEditMode(true)}
                className={styles.editButton}
              >
                Edit Profile
              </button>
            </div>
          )}
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
