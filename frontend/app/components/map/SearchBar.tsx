import React, { useState } from 'react';
import axios from 'axios';
import styles from './map.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

interface SearchBarProps {
    coordinates: {
        latMin: number;
        latMax: number;
        longMin: number;
        longMax: number;
    };
    onResultsFound: (events: any[]) => void; // Callback function to handle the results
    onSearch: (searchTerm: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ coordinates, onResultsFound, onSearch }) => {
    const [searchWord, setSearchWord] = useState('');

    const handleSearch = async () => {
        try {
            const response = await axios.get('http://localhost:9000/event', {
                params: {
                    searchWord: searchWord,
                    latMin: coordinates.latMin,
                    latMax: coordinates.latMax,
                    longMin: coordinates.longMin,
                    longMax: coordinates.longMax,
                },
                headers: {
                    authorization: localStorage.getItem('token')
                }
            });
            onResultsFound(response.data); // Pass the found events to the parent component
            onSearch(searchWord);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch(); // Trigger search on Enter key press
        }
    };

    return (
        <div className={styles.searchBar}>
            <input
                type="text"
                className={styles.searchInput}
                placeholder="Search..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                onKeyDown={handleKeyDown} // Listen for Enter key
            />
            <button className={styles.searchButton} onClick={handleSearch}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
        </div>
    );
};

export default SearchBar;
