"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./profile.module.css";
import Loader from "../loader/loader";
import Image from "next/image";
import { Event } from "../eventCard/types";
import { selectColor } from "../eventCard/eventUtils";
import  { useRouter } from "next/navigation";
import eventStyles from "../map/SideBars/eventbar.module.css";
interface ProfileData {
  username: string;
  firstName: string;
  lastName: string;
  biography: string;
  country: string;
  city: string;
  street: string;
  number: string;
  zipCode: string;
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
    biography: "",
    eventsOrganized: [],
    eventsParticipated: [],
    country: "",
    city: "",
    street: "",
    number: "",
    zipCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [eventsOrganized, setEventsOrganized] = useState<Event[]>([]);
  const [eventsParticipated, setEventsParticipated] = useState<Event[]>([]);
  const router = useRouter();

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

      const eventsResponse = await axios.get(`http://localhost:9000/event/${username}/entries`, {
        headers: { Authorization: token },
      });

      console.log(eventsResponse.data);

      setEventsOrganized(eventsResponse.data.organizedEvents || []);
      setEventsParticipated(eventsResponse.data.events || []);


      if (!response.data.profilePicture){
        setProfilePicture('/images/usericon.png');
        return;
      }
      setProfilePicture('http://localhost:9000'+response.data.profilePicture);
      console.log(response.data.profilePicture);

    } catch (err) {
      console.error("Error fetching profile data:", err);
      setErrorMessage("Failed to load profile data.");
      router.push('/map');
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    console.log(name, value);
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
      data.append("biography", formData.biography);
      data.append("country", formData.country);
      data.append("city", formData.city);
      data.append("street", formData.street);
      data.append("zipCode", formData.zipCode);
      data.append("number", formData.number);

  
      const response = await axios.put(`http://localhost:9000/user`, data, {
        headers: { Authorization: token, "Content-Type": "application/json" },
      });

      if (response.status === 400) {
        setErrorMessage("Invalid data provided. Please check your inputs.");
        return;  
      }

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
      // window.location.reload();
    } catch (err) {
      console.error("Error saving profile data:", err);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  
  useEffect(() => {
    setEventsOrganized([]);
    setEventsParticipated([]);
    fetchProfileData();
    document.title = username + "'s Profile";

  }, [username]);
    const getBorderColor = (event: Event) => {
      let color: string | null = null;
      selectColor(event, (selectedColor) => {
        color = selectedColor;
      });
      return color;
    };


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
              {/* Profile Picture */}
              <label>
                <span>Profile Picture:</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
              </label>

              {/* Existing Fields */}
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
                  name="biography"
                  value={formData.biography}
                  onChange={handleInputChange}
                  className={styles.textarea}
                />
              </label>

              {/* New Address Fields */}
              <label>
                <span>Country:</span>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </label>

              <label>
                <span>City:</span>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </label>

              <label>
                <span>Street Number:</span>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </label>

              <label>
                <span>Street:</span>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </label>

              <label>
                <span>Postal Code:</span>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </label>

              {/* Save and Cancel Buttons */}
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
            // Existing Profile Details Section
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

              <p className={styles.biography}>
                {profileData.biography || "No biography provided."}
              </p>

              {/* New Address Details Section
              <div className={styles.address}>
                <p><strong>Country:</strong> {profileData.country || "N/A"}</p>
                <p><strong>City:</strong> {profileData.city || "N/A"}</p>
                <p><strong>Street:</strong> {profileData.street || "N/A"}</p>
                <p><strong>Postal Code:</strong> {profileData.zipCode || "N/A"}</p>
              </div> */}

              {/* Edit Profile Button */}
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

{successMessage && <p className={styles.success}>{successMessage}</p>}
{errorMessage && <p className={styles.error}>{errorMessage}</p>}

  {/* Events Section */}
  <div className={styles.eventsSection}>
    <div className={styles.eventsColumns}>
      {/* Participated Events */}
      <div className={styles.eventsColumn}>
        <h2 className={eventStyles.eventBarSectionTitle}>Events Participated</h2>
        {eventsParticipated.length > 0 ? (
          eventsParticipated.map((event: Event) => (
            <div
              key={event.id}
              className={eventStyles.eventCard}
              style={{
                border: `2px solid ${getBorderColor(event)}`,
              }}
            >
              <h3 className={eventStyles.eventBarCardTitle}>{event.title}</h3>
              <p>
                <strong>Location:</strong> {event.street}, {event.city}, {event.zipCode}
              </p>
              <p>
                <strong>Begin:</strong> {new Date(event.beginDate).toLocaleString().slice(0, -3)}
              </p>
              <p>
                <strong>End:</strong> {new Date(event.endDate).toLocaleString().slice(0, -3)}
              </p>
              <p>
                <strong>Category:</strong> {event.category}
              </p>
              <p>
                <a 
                  style={{
                    cursor: 'pointer',
                    color: ` ${getBorderColor(event)}`,
                   
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/event?id=${event.id}`);
                  }}
                >
                  More Information
                </a>
              </p>
            </div>
          ))
        ) : (
          <p className={styles.noEvents}>No signed-up events found.</p>
        )}
      </div>

      {/* Organized Events */}
      <div className={styles.eventsColumn}>
        <h2 className={eventStyles.eventBarSectionTitle}>Organized Events</h2>
        {eventsOrganized.length > 0 ? (
          eventsOrganized.map((event: Event) => (
            <div
              key={event.id}
              className={eventStyles.eventCard}
              style={{
                border: `2px solid ${getBorderColor(event)}`,
              }}
            >
              <h3 className={eventStyles.eventBarCardTitle}>{event.title}</h3>
              <p>
                <strong>Location:</strong> {event.street}, {event.city}, {event.zipCode}
              </p>
              <p>
                <strong>Begin:</strong> {new Date(event.beginDate).toLocaleString().slice(0, -3)}
              </p>
              <p>
                <strong>End:</strong> {new Date(event.endDate).toLocaleString().slice(0, -3)}
              </p>
              <p>
                <strong>Category:</strong> {event.category}
              </p>
              <p>
                <a
                  style={{
                    cursor: 'pointer',
                    color: ` ${getBorderColor(event)}`,
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/event?id=${event.id}`);
                  }}
                >
                  More Information
                </a>
              </p>
            </div>
          ))
        ) : (
          <p className={styles.noEvents}>No organized events found.</p>
        )}
            </div>
          </div>
    </div>
  </div>
) : (
  <p>Error: Unable to load profile data.</p>
)}



</div>
);
};

export default Profile;
