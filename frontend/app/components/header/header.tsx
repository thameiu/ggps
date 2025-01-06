"use client";
import React, { useEffect, useState } from "react";
import styles from "./header.module.css";
import Image from "next/image";
import axios from "axios";
import {useRouter} from 'next/navigation';
import Modal from "../modal/Modal";

const Header: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [username, setUsername] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>();
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated.");

        const response = await axios.post(
          "http://localhost:9000/auth/verify-token",
          {},
          { headers: { Authorization: token } }
        );

        const user = response.data.user;
        setUsername(user.username);
        if (user.profilePicture) setProfilePicture('http://localhost:9000'+user.profilePicture);

      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className={styles.topBar}>
      <div className={styles.logo}>
        <img className={styles.logo} src="/images/logo.png" alt="Logo" />
      </div>
      <div className={styles.nav}>
        <ul>
          <li>
            <a 
              style={{
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/`);
              }}
            >
              Home
            </a>
          </li>
          <li>
            <a
              style={{
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/map`);
              }}
            >
              Map
            </a>
          </li>
          <li>
            <a
              style={{
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.preventDefault();
                setShowLogoutModal(true);
              }}
            >
              Logout
            </a>
          </li>
          <li>
            <a
                style={{
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/profile?username=${username}`);
                }}
                className={styles.userLink}
            >
              <img
                className={styles.userIcon}
                src={profilePicture || "/images/usericon.png"} 
                alt="User"
                width={40}
                height={40}
              />
            </a>
          </li>
        </ul>
      </div>
      {showLogoutModal && (
        <Modal
          title="Log out"
          message="Are you sure you want to log out ? You will have to log in again."
          confirmText="Log out"
          cancelText="Cancel"
            onConfirm={ () => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
};

export default Header;
