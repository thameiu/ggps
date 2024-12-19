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
    onResultsFound: (events: any[]) => void;
    onSearch: (searchTerm: string) => void;
    onCategoryChange: (category: string) => void;

}

const SearchBar: React.FC<SearchBarProps> = ({ coordinates, onResultsFound, onSearch, onCategoryChange }) => {
    const [searchWord, setSearchWord] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleSearch = async () => {
        try {
            const response = await axios.get('http://localhost:9000/event', {
                params: {
                    searchWord: searchWord,
                    category: selectedCategory || undefined, 
                    latMin: coordinates.latMin,
                    latMax: coordinates.latMax,
                    longMin: coordinates.longMin,
                    longMax: coordinates.longMax,
                },
                headers: {
                    authorization: localStorage.getItem('token')
                }
            });
            onResultsFound(response.data); 
            onSearch(searchWord);
            onCategoryChange(selectedCategory);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch(); 
        }
    };

    return (
        <div className={styles.searchBar}>
            <select
                className={styles.categorySelector}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value="">All Categories</option>
                <option value="Lan">Lan</option>
                <option value="Tournament">Tournament</option>
                <option value="Convention">Convention</option>
                <option value="Esport Event">E-sport Event</option>
                <option value="Speedrunning event">Speedrunning Event</option>

            </select>
            <input
                type="text"
                className={styles.searchInput}
                placeholder="Search..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                onKeyDown={handleKeyDown} 
            />

            <button className={styles.searchButton} onClick={handleSearch}>
                <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
        </div>
    );
};

export default SearchBar;
