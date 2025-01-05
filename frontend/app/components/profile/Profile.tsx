"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./profile.module.css";
import Loader from "../loader/loader";
import Image from "next/image";

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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

      if (!response.data.profilePicture){
        setProfilePicture('/images/usericon.png');
        return;
      }
      setProfilePicture('http://localhost:9000'+response.data.profilePicture);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated.");
  
      const data = new FormData();
      data.append("username", formData.username);
      data.append("firstName", formData.firstName);
      data.append("lastName", formData.lastName);
      data.append("bio", formData.bio || "");
  
      await axios.put(`http://localhost:9000/user`, data, {
        headers: { Authorization: token, "Content-Type": 	"application/json" },
      });
  
      if (selectedFile) {
        const pictureData = new FormData();
        pictureData.append("file", selectedFile);
  
        await axios.post(`http://localhost:9000/user/profile-picture`, pictureData, {
          headers: { Authorization: token, "Content-Type": "multipart/form-data" },
        });
        const newProfilePictureURL = URL.createObjectURL(selectedFile);
        setProfilePicture(newProfilePictureURL);
 
        localStorage.setItem("profilePicture", newProfilePictureURL);

      }
  
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
      <h1 className={styles.header}>{profileData?.username}'s Profile</h1>

      {profileData ? (
        <div className={styles.profileCard}>
          {editMode && loggedInUsername === username ? (
            
            <div className={styles.form}>
              <label>
                <span>Profile Picture:</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  
                  
                />
              </label>

              <label>
                <span>Username:</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={styles.input}
                  disabled
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
              <div className={styles.profileHeader}>
                <img
                  src={profilePicture || "/images/usericon.png"}
                  alt={`${username}'s profile picture`}
                  className={styles.profilePicture}
                  width={150}
                  height={150}
                />
                <div className={styles.username}>
                  {profileData.username}
                  <div className={styles.nameRow}>
                    <p className={styles.firstName}>
                      {profileData.firstName || "N/A"}
                    </p>
                    <p className={styles.lastName}>
                      {profileData.lastName || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <p className={styles.bio}>
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
              {/* <h2>Events Organized</h2> */}
              {profileData.eventsOrganized?.length ? (
                <ul>
                  {profileData.eventsOrganized.map((event) => (
                    <li key={event.id}>
                      {event.name} - {event.date}
                    </li>
                  ))}
                </ul>
              ) : (
                ''
              )}
            </div>

            <div>
              {/* <h2>Events Participated</h2> */}
              {profileData.eventsParticipated?.length ? (
                <ul>
                  {profileData.eventsParticipated.map((event) => (
                    <li key={event.id}>
                      {event.name} - {event.date}
                    </li>
                  ))}
                </ul>
              ) : (
                ' '
              )}
            </div>
          </div>
        </div>
      ) : (
        <p>Error: Unable to load profile data.</p>
      )}

      {successMessage && <p className={styles.success}>{successMessage}</p>}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
    </div>
  );
};

export default Profile;
