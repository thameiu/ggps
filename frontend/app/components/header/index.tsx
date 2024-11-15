import React from 'react';
import styles from './header.module.css';

const Header: React.FC = () => {
    return (
        <div className={styles.topBar}>
            <div className={styles.logo}>
                <h1>GGPS</h1>
            </div>
            <nav className={styles.nav}>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/about">About</a></li>
                    <li><a href="/contact">Contact</a></li>
                </ul>
            </nav>
        </div>
    );
};

export default Header;