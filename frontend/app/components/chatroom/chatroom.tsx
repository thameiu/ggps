"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "./chatroom.module.css";
import { Event } from "../eventCard/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack, faThumbTackSlash, faSearch, faUser, faTimes } from "@fortawesome/free-solid-svg-icons";
import io from "socket.io-client";
import Loader from "../loader/loader";

// Helper function to format message dates
const formatMessageDate = (dateString: string): string => {
    const messageDate = new Date(dateString);
    const now = new Date();
    
    // Reset hours to compare just the dates
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDay = new Date(messageDate);
    messageDay.setHours(0, 0, 0, 0);
    
    // Format the time part
    const timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Check if message is from today or yesterday
    if (messageDay.getTime() === today.getTime()) {
        return `Today - ${timeString}`;
    } else if (messageDay.getTime() === yesterday.getTime()) {
        return `Yesterday - ${timeString}`;
    } else {
        // Format the date based on whether it's this year or not
        const thisYear = now.getFullYear() === messageDate.getFullYear();
        
        if (thisYear) {
            // If it's this year, just show the month and day
            return messageDate.toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric' 
            }) + ` - ${timeString}`;
        } else {
            // If it's a different year, include the year
            return messageDate.toLocaleDateString([], { 
                year: 'numeric',
                month: 'short', 
                day: 'numeric' 
            }) + ` - ${timeString}`;
        }
    }
};

interface ChatRoomProps {
    event: Event;
    color: string | null;
}

interface Message {
    message: {
        id: number;
        createdAt: string;
        userId: number;
        content: string;
        pinned: boolean;
    };
    username: string;
}

interface ChatUser {
    username: string;
    profilePicture?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ event, color }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [cannotRead, setCannotRead] = useState<boolean>(false);
    const [cannotWrite, setCannotWrite] = useState<boolean>(false);
    
    // New states for search functionality
    const [searchInput, setSearchInput] = useState<string>("");
    const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
    const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [searchMode, setSearchMode] = useState<'content' | 'user'>('content');
    const searchRef = useRef<HTMLDivElement>(null);

    const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);

    const socket = useRef(io("http://127.0.0.1:9000")).current;

    const token = localStorage.getItem("token");
    const lastMessageId = useRef<number | null>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);
    const [isSendDisabled, setIsSendDisabled] = useState<boolean>(false);

    useEffect(() => {
        if (isSendDisabled) {
            const timer = setTimeout(() => {
                setIsSendDisabled(false);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isSendDisabled]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const accessResponse = await axios.get("http://localhost:9000/chat/access", {
                    params: { token, eventId: event.id },
                    headers: { authorization: token },
                });
                console.log(accessResponse.data)

                if (accessResponse.status === 200) {
                    setUsername(accessResponse.data.username);
                    setIsOrganizer(accessResponse.data.access.role === "organizer");
                    setIsAdmin(accessResponse.data.access.role === "admin");
                    setCannotRead(accessResponse.data.access.role === "none");

                    const messagesResponse = await axios.get(`http://localhost:9000/chat/${event.id}/messages`, {
                        headers: { authorization: token },
                    });

                    const newMessages = messagesResponse.data.filter((msg: Message) => {
                        return (
                            lastMessageId.current === null ||
                            msg.message.id > lastMessageId.current
                        );
                    });

                    // Modify the code in the fetchData function where we set up the initial chatUsers
                    if (newMessages.length > 0) {
                        setMessages((prevMessages) => [...prevMessages, ...newMessages]);
                        setFilteredMessages((prevMessages) => [...prevMessages, ...newMessages]);

                        const latestMessageId = newMessages[newMessages.length - 1].message.id;
                        lastMessageId.current = latestMessageId;

                        // Extract unique usernames for dropdown - IMPROVED APPROACH
                        const allMessages = [...messages, ...newMessages];
                        const uniqueUsersMap = new Map();
                        
                        // Use a Map to ensure uniqueness by username
                        allMessages.forEach((msg: Message) => {
                            if (!uniqueUsersMap.has(msg.username)) {
                                uniqueUsersMap.set(msg.username, {
                                    username: msg.username,
                                    profilePicture: `http://localhost:9000/user/${msg.username}/profile-picture`
                                });
                            }
                        });
                        
                        // Convert Map values to array
                        const uniqueUsersArray = Array.from(uniqueUsersMap.values());
                        setChatUsers(uniqueUsersArray);

                        scrollToBottom();
                    }
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

    }, [event.id]);

    useEffect(() => {
        if (!socket) {
            console.log("Socket not connected.");
            return;
        }

        socket.emit("joinChatroom", { eventId: event.id, token });

        // Update the socket.on("receiveMessage") handler where we add users to chatUsers
        socket.on("receiveMessage", (message: Message) => {
            if (!messages.some((msg) => msg.message.id === message.message.id)) {
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages, message];
                    
                    // Update chat users list if a new user posts - FIX THE DUPLICATE USERS ISSUE
                    setChatUsers((prevUsers) => {
                        // Only add if the user doesn't already exist in the list
                        if (!prevUsers.some(user => user.username === message.username)) {
                            return [
                                ...prevUsers,
                                { 
                                    username: message.username,
                                    profilePicture: `http://localhost:9000/user/${message.username}/profile-picture`
                                }
                            ];
                        }
                        return prevUsers; // Return unchanged if user already exists
                    });
                    
                    // Apply filters based on current search state
                    updateFilteredMessages(updatedMessages);
                    return updatedMessages;
                });
            }
        });

        socket.on("messagePinned", (updatedMessage: Message) => {
            setMessages((prevMessages) => {
                const updated = prevMessages.map((message) =>
                    message.message.id === updatedMessage.message.id
                        ? { ...message, message: updatedMessage.message }
                        : message
                );
                
                // Apply filters based on current search state
                updateFilteredMessages(updated);
                return updated;
            });
        });

        return () => {
            socket.emit("leaveChatroom", { eventId: event.id });
            socket.off("sendMessage");
            socket.off("pinMessage");
            socket.off("receiveMessage");
            socket.off("messagePinned");
        };
    }, [event.id, showPinnedOnly, selectedUser, searchInput]);

    // Function to update filtered messages based on all criteria
    const updateFilteredMessages = (messagesToFilter: Message[]) => {
        let filtered = messagesToFilter;
        
        // Filter by pinned status if enabled
        if (showPinnedOnly) {
            filtered = filtered.filter(msg => msg.message.pinned);
        }
        
        // Filter by selected user if any
        if (selectedUser) {
            filtered = filtered.filter(msg => msg.username === selectedUser);
        }
        
        // Filter by search query if in content mode
        if (searchMode === 'content' && searchInput) {
            filtered = filtered.filter(msg => 
                msg.message.content.toLowerCase().includes(searchInput.toLowerCase())
            );
        }
        
        setFilteredMessages(filtered);
    };

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = () => {
        if (!newMessage.trim() || isSendDisabled) return;

        socket.emit("sendMessage", { token, eventId: event.id, content: newMessage });

        setNewMessage("");
        setIsSendDisabled(true);
    };

    const pinMessage = (messageId: number) => {
        socket.emit("pinMessage", { token, messageId, eventId: event.id });
    };

    const toggleShowPinned = () => {
        setShowPinnedOnly((prev) => !prev);
    };
    
    // Apply all filters when any filter criteria changes
    useEffect(() => {
        updateFilteredMessages(messages);
    }, [showPinnedOnly, selectedUser, searchInput, searchMode]);
    
    const handleMessageClick = (messageId: number) => {
        setSelectedMessageId((prev) => (prev === messageId ? null : messageId));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    // Handle search input changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchInput(query);
        
        if (searchMode === 'user') {
            setShowUserDropdown(query.length > 0);
        }
    };
    
    // Select a user from dropdown
    const handleUserSelect = (user: string) => {
        setSelectedUser(user);
        setShowUserDropdown(false);
        setSearchInput(''); // Clear search input after selection
    };
    
    // Toggle search mode between content and username
    const toggleSearchMode = () => {
        setSearchMode(prev => prev === 'content' ? 'user' : 'content');
        setSearchInput('');
        setShowUserDropdown(false);
    };
    
    // Clear all search filters
    const clearSearch = () => {
        setSearchInput('');
        setSelectedUser(null);
        setSearchMode('content');
    };
    
    // Filter users for dropdown based on search input
    const filteredUsers = searchInput.length > 0 
        ? chatUsers.filter(user => 
            user.username.toLowerCase().includes(searchInput.toLowerCase())
        )
        : chatUsers;

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            
            const isAtBottom = messageEndRef.current && 
            messageEndRef.current.getBoundingClientRect().bottom <= window.innerHeight;

            if (isAtBottom) {
                scrollToBottom();
            }
            if (lastMessage.username === username) {
                scrollToBottom();
            }
        }
    }, [messages]);

    return (
        <div className={styles.chatroomContainer}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <h2 className={styles.eventTitle}>{event.title} - chat</h2>
                <button
                    className={styles.showPinnedButton}
                    onClick={toggleShowPinned}
                    style={{
                        backgroundColor: color || "#000",
                    }}
                >
                    <FontAwesomeIcon icon={showPinnedOnly ? faThumbTackSlash : faThumbtack} />
                </button>
                
                {/* Search mode toggle button */}
                <button
                    className={styles.searchModeButton}
                    onClick={toggleSearchMode}
                    style={{
                        backgroundColor: color || "#000",
                    }}
                >
                    <FontAwesomeIcon icon={searchMode === 'content' ? faSearch : faUser} />
                    <span className={styles.searchModeLabel}>
                        {searchMode === 'content' ? 'Content' : 'User'}
                    </span>
                </button>
            </div>

            {/* Search Bar */}
            <div className={styles.searchContainer} ref={searchRef}>
                <div className={styles.searchInputWrapper}>
                    <FontAwesomeIcon 
                        icon={searchMode === 'content' ? faSearch : faUser} 
                        className={styles.searchIcon} 
                    />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={handleSearchChange}
                        placeholder={searchMode === 'content' ? "Search messages..." : "Search users..."}
                        className={styles.searchInput}
                    />
                    {(searchInput.length > 0 || selectedUser) && (
                        <button 
                            onClick={clearSearch} 
                            className={styles.clearSearchButton}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    )}
                </div>
                
                {/* Selected User Indicator */}
                {selectedUser && (
                    <div className={styles.selectedUserChip}>
                        <img
                            src={`http://localhost:9000/user/${selectedUser}/profile-picture`}
                            alt={selectedUser}
                            className={styles.userProfilePic}
                            onError={(e) => {
                                e.currentTarget.src = "/images/usericon.png";
                            }}
                        />
                        <span>{selectedUser}</span>
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className={styles.removeUserButton}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                )}
                
                {/* User Dropdown for username search */}
                {searchMode === 'user' && showUserDropdown && filteredUsers.length > 0 && (
                    <div className={styles.userDropdown}>
                        {filteredUsers.map(user => (
                            <div 
                                key={user.username} 
                                className={styles.userDropdownItem}
                                onClick={() => handleUserSelect(user.username)}
                            >
                                <img
                                    src={user.profilePicture || "/images/usericon.png"}
                                    alt={user.username}
                                    className={styles.userProfilePic}
                                    onError={(e) => {
                                        e.currentTarget.src = "/images/usericon.png";
                                    }}
                                />
                                <span>{user.username}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Filter Status Indicator */}
            {(showPinnedOnly || selectedUser || (searchMode === 'content' && searchInput)) && (
                <div className={styles.filterStatus}>
                    {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'} shown
                    {showPinnedOnly && <span className={styles.filterBadge}>Pinned Only</span>}
                    {selectedUser && <span className={styles.filterBadge}>User: {selectedUser}</span>}
                    {searchMode === 'content' && searchInput && 
                        <span className={styles.filterBadge}>Contains: "{searchInput}"</span>
                    }
                </div>
            )}

            {/* Messages List */}
            <div
                className={styles.messagesContainer}
                style={{
                    scrollbarColor: color || "#fff",
                }}
            >
                {isLoading ? (
                    <Loader/>
                ) : cannotRead ? (
                    <p className={styles.noMessages}>You do not have permission to read messages.</p>
                ) : filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                        <div
                            key={message.message.id}
                            onClick={() => handleMessageClick(message.message.id)}
                            style={{
                                alignSelf: message.username === username ? "flex-end" : "flex-start",
                                flexDirection: message.username === username ? "row-reverse" : "row",
                                background: message.message.pinned
                                    ? `linear-gradient(to right, rgba(${parseInt(color?.slice(5, 8) || '0')}, ${parseInt(color?.slice(9, 12) || '0')}, ${parseInt(color?.slice(13, 16) || '0')}, 0.2), rgba(${parseInt(color?.slice(5, 8) || '0')}, ${parseInt(color?.slice(9, 12) || '0')}, ${parseInt(color?.slice(13, 16) || '0')}, 0))`
                                    : "",
                                borderWidth: message.message.pinned ? "1px" : "",
                                borderStyle: message.message.pinned ? "solid" : "",
                                borderImage: message.message.pinned
                                    ? `linear-gradient(to right, rgba(${parseInt(color?.slice(5, 8) || '0')}, ${parseInt(color?.slice(9, 12) || '0')}, ${parseInt(color?.slice(13, 16) || '0')}, 0.5), rgba(${parseInt(color?.slice(5, 8) || '0')}, ${parseInt(color?.slice(9, 12) || '0')}, ${parseInt(color?.slice(13, 16) || '0')}, 0)) 1`
                                    : "",
                            }}
                            className={styles.messageContainer}
                        >
                            {/* Profile Picture */}
                            {message.username !== username && (
                                <img
                                    src={`http://localhost:9000/user/${message.username}/profile-picture`}
                                    className={styles.messageProfilePicture}
                                    alt={`${message.username}'s profile`}
                                    onError={(e) => {
                                        e.currentTarget.src = "/images/usericon.png";
                                    }}
                                />
                            )}
                            {/* Message Body */}
                            <div className={styles.messageBody}>
                                <p
                                    className={styles.username}
                                    style={{
                                        textAlign: message.username === username ? "right" : "left",
                                        color: message.message.pinned ? "#EEE" : "",
                                    }}
                                >
                                    {message.username === username ? "You" : message.username}
                                </p>
                                <p
                                    className={styles.messageContent}
                                    style={{
                                        backgroundColor: message.username === username ? "#565654" : "#222",
                                        textAlign: message.username === username ? "right" : "left",
                                    }}
                                >
                                    {message.message.content}
                                </p>

                                {(isOrganizer || isAdmin) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent message click
                                            pinMessage(message.message.id);
                                        }}
                                        className={styles.pinButton}
                                        style={{ marginLeft: "8px" }}
                                    >
                                        {message.message.pinned ? (
                                            <FontAwesomeIcon icon={faThumbTackSlash} />
                                        ) : (
                                            <FontAwesomeIcon icon={faThumbtack} />
                                        )}
                                    </button>
                                )}

                                {/* Show smart formatted date/time when the message is clicked */}
                                {selectedMessageId === message.message.id && (
                                    <small
                                        style={{
                                            color: "#888",
                                            display: "block",
                                            marginTop: "8px",
                                            textAlign: message.username === username ? "right" : "left",
                                        }}
                                    >
                                        {formatMessageDate(message.message.createdAt)}
                                    </small>
                                )}
                            </div>
                        </div>
                    ))
                ) : showPinnedOnly || selectedUser || searchInput ? (
                    <p className={styles.noMessages}>No messages match your search criteria.</p>
                ) : (
                    <p className={styles.noMessages}>No messages yet.</p>
                )}
                <div ref={messageEndRef} />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
                <input
                    disabled={isSendDisabled || cannotWrite || cannotRead}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={cannotWrite || cannotRead ? "You do not have permission to write messages." : "Type a message..."}
                    className={styles.inputField}
                />
                <button
                    disabled={isSendDisabled || cannotWrite || cannotRead}
                    className={styles.sendButton}
                    onClick={sendMessage}
                    style={{
                        backgroundColor: color || "#000",
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatRoom;