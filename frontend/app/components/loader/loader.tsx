import React from 'react';
import styles from './loader.module.css';

const Loader: React.FC = () => {
    return (
        <div className={styles.loader}>
            <img src="/images/loading.gif" alt="Loading..." />
        </div>
    );
};

export default Loader;