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

    const setCookie = (name: string, value: string, days = 30) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
    };

    const getCookie = (name: string) => {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [key, value] = cookie.split("=");
            if (key === name) return decodeURIComponent(value);
        }
        return null;
    };

    const updateSearchCount = (name: string, value: string) => {
        // Retrieve current count
        const currentCount = parseInt(getCookie(`${name}_${value}`) || "0", 10);
        const newCount = currentCount + 1;

        setCookie(`${name}_${value}`, newCount.toString());

        const mostSearched = getCookie(name);
        const mostSearchedCount = parseInt(getCookie(`${name}_${mostSearched}`) || "0", 10);

        if (!mostSearched || newCount > mostSearchedCount) {
            setCookie(name, value); 
        }
    };

    const handleSearch = async (newCategory?: string) => {
        try {
            
            let finalSearchWord = searchWord.trim() || getCookie("keyword") || "";
            let finalCategory = newCategory ?? (selectedCategory || getCookie("category") || "");
            console.log(finalCategory, finalSearchWord, "finalCategory, finalSearchWord");
            console.log(newCategory, selectedCategory, searchWord, "category, searchWord");

            if (searchWord) updateSearchCount("keyword", finalSearchWord);
            if (selectedCategory) updateSearchCount("category", finalCategory);
    
            let recommend = false;
            if (searchWord === "" && selectedCategory === "" && newCategory === undefined ) {
                recommend = true;
            }
            if (searchWord && selectedCategory === "" && newCategory === undefined ) {
                finalCategory = "";
                recommend = false;
                console.log("cbon?")
            }

            // Prepare request parameters
            const params: Record<string, any> = {
                searchWord: finalSearchWord || undefined,
                category: finalCategory || undefined,
                latMin: coordinates.latMin,
                latMax: coordinates.latMax,
                longMin: coordinates.longMin,
                longMax: coordinates.longMax,
                ...(dateFilter && { pastEvents: dateFilter }),
                ...(recommend && { recommend: recommend }),
            };
    
            const response = await axios.get("http://localhost:9000/event", {
                params,
                headers: {
                    authorization: localStorage.getItem("token"),
                },
            });
    
            const events = response.data;
    
            localStorage.setItem("fetchedEvents", JSON.stringify(events));
    
            onResultsFound(events);
            onSearch(searchWord);
            // onCategoryChange(selectedCategory);//TODO: make sure this doesn't activate fetchEvents
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
