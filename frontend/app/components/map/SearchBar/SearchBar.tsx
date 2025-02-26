import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./searchbar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

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
    onDateFilterToggle: (dateFilter: boolean) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    coordinates,
    onResultsFound,
    onSearch,
    onCategoryChange,
    onDateFilterToggle,
}) => {
    const [searchWord, setSearchWord] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [dateFilter, setDateFilter] = useState<boolean>(false);

    // Helper function to set cookies
    const setCookie = (name: string, value: string, days = 30) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
    };

    // Helper function to get cookies
    const getCookie = (name: string) => {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [key, value] = cookie.split("=");
            if (key === name) return decodeURIComponent(value);
        }
        return null;
    };

    // Function to update the search count for keywords and categories
    const updateSearchCount = (name: string, value: string) => {
        // Retrieve current count
        const currentCount = parseInt(getCookie(`${name}_${value}`) || "0", 10);
        const newCount = currentCount + 1;

        // Update the count in cookies
        setCookie(`${name}_${value}`, newCount.toString());

        // Check if this is now the most searched keyword/category
        const mostSearched = getCookie(name);
        const mostSearchedCount = parseInt(getCookie(`${name}_${mostSearched}`) || "0", 10);

        if (!mostSearched || newCount > mostSearchedCount) {
            setCookie(name, value); // Update the most searched keyword/category
        }
    };

    // Retrieve stored search parameters on mount
    useEffect(() => {
        const mostSearchedWord = getCookie("mostSearchedWord");
        const mostSearchedCategory = getCookie("mostSearchedCategory");

        if (mostSearchedWord) setSearchWord(mostSearchedWord);
        if (mostSearchedCategory) setSelectedCategory(mostSearchedCategory);
    }, []);

    const handleSearch = async (category?: string) => {
        try {
            const finalCategory = category ?? selectedCategory;

            // Update search counts and track the most searched keyword/category
            updateSearchCount("keyword", searchWord);
            if (finalCategory) updateSearchCount("category", finalCategory);

            const response = await axios.get("http://localhost:9000/event", {
                params: {
                    searchWord,
                    category: finalCategory || undefined,
                    latMin: coordinates.latMin,
                    latMax: coordinates.latMax,
                    longMin: coordinates.longMin,
                    longMax: coordinates.longMax,
                    ...(dateFilter && { pastEvents: dateFilter }),
                    
                },
                headers: {
                    authorization: localStorage.getItem("token"),
                },
            });

            onResultsFound(response.data);
            onSearch(searchWord);
            onCategoryChange(finalCategory);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const toggleDateFilter = () => {
        const newFilterState = !dateFilter;
        setDateFilter(newFilterState);
        onDateFilterToggle(newFilterState);
    };

    const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value;
        setSelectedCategory(newCategory);
        onCategoryChange(newCategory);
        handleSearch(newCategory);
    };

    return (
        <div className={styles.searchBar}>
            <label className={styles.filterToggle}>
                <input type="checkbox" checked={dateFilter} onChange={toggleDateFilter} />
                <span className={styles.slider}></span>
                <span className={styles.sliderText}>Past events</span>
            </label>
            <select
                className={styles.categorySelector}
                value={selectedCategory}
                onChange={handleCategoryChange}
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
            <button className={styles.searchButton} onClick={() => handleSearch()}>
                <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
        </div>
    );
};

export default SearchBar;
