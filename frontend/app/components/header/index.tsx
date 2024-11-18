import React from 'react';
import styles from './header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const Header: React.FC = () => {
    return (
        <div className={styles.topBar}>
            <div className={styles.logo}>
                <h1>GGPS</h1>
            </div>
            <div className={styles.nav}>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/map">Map</a></li>
                    <li><a href="/contact">Contact</a></li>
                    <li><a href="/profile"><FontAwesomeIcon icon={faUser} /></a></li>
                </ul>
            </div>
            
        </div>
    );
};

export default Header;