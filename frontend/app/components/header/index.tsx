"use client"
import React, { useEffect, useState } from 'react';
import styles from './header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

const Header: React.FC = () => {
    const [currentPath, setCurrentPath] = useState<string>('');

    useEffect(() => {
        
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname);
        }
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
                    {/* <li><a href="/profile"><FontAwesomeIcon icon={faUser} /></a></li> */}
                    <li><a href="/profile">
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
            {/* Render the search bar only on /map */}

        </div>
    );
};

export default Header;
