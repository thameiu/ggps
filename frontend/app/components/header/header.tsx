"use client"
import React, { useEffect, useState } from 'react';
import styles from './header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import axios from 'axios';

const Header: React.FC = () => {
    const [currentPath, setCurrentPath] = useState<string>('');
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname);
        }
    }, []);

    useEffect(() => {
        const fetchUsername = async () => {
          try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("User not authenticated.");
    
            const response = await axios.post(
              "http://localhost:9000/auth/verify-token",
              {},
              { headers: { Authorization: token } }
            );
    
            setUsername(response.data.user.username);
          } catch (err) {
            console.error("Error verifying token:", err);
          }
        };
    
        fetchUsername();
      }, []);

    return (
        <div className={styles.topBar}>
            <div className={styles.logo}>
                <img className={styles.logo} src="/images/logo.png" alt="Logo" />
            </div>
            <div className={styles.nav}>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/map">Map</a></li>
                    <li><a href="/contact">Contact</a></li>
                    <li><a  href={username?`/profile?username=${username}`:'/login'}>
                    <Image
                    className={styles.userIcon}
                    src="/images/user.png"
                    alt="User"
                    width={30}
                    height={30}
                    />
                    </a></li>

                </ul>
            </div>
        </div>
    );
};

export default Header;
