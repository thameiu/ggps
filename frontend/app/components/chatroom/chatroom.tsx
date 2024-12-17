"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "./chatroom.module.css";

interface ChatRoomProps {
    eventId: string; // Chatroom ID
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

const ChatRoom: React.FC<ChatRoomProps> = ({ eventId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [username, setUsername] = useState<string | null>(null);

    const token = localStorage.getItem("token");
    const lastMessageId = useRef<number | null>(null); // To track the last message ID
    const messageEndRef = useRef<HTMLDivElement>(null); // For auto-scrolling to bottom

    // Verify token and get user info
    useEffect(() => {
        const initializeChat = async () => {
            await verifyToken(); // Wait for the username to be set
            fetchMessages();
        };
    
        initializeChat();
    
        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [eventId]);

    
    const verifyToken = async () => {
        try {
            const response = await axios.post(
                "http://localhost:9000/auth/verify-token",
                {},
                { headers: { authorization: token } }
            );
            if (response.data.valid) {
                setUsername(response.data.user.username);
            }
        } catch (error) {
            console.error("Token verification failed:", error);
        }
    };

    // Fetch chat messages dynamically
    const fetchMessages = async () => {
        try {
            const response = await axios.get(`http://localhost:9000/chat/${eventId}/messages`, {
                headers: { Authorization: token },
            });

            const newMessages = response.data.filter((msg: Message) => {
                // Check if the message is new (based on its ID)
                return lastMessageId.current === null || msg.message.id > lastMessageId.current;
            });

            if (newMessages.length > 0) {
                setMessages((prevMessages) => [...prevMessages, ...newMessages]);

                // Update the lastMessageId to the latest one
                const latestMessageId = newMessages[newMessages.length - 1].message.id;
                lastMessageId.current = latestMessageId;

                // Auto-scroll to the bottom when new messages arrive
                messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
    
        try {
            const response = await axios.post(
                "http://localhost:9000/chat/message",
                { token, eventId, content: newMessage },
                { headers: { Authorization: token } }
            );
    
            const formattedMessage: Message = {
                message: {
                    id: response.data.message.id,
                    createdAt: response.data.message.createdAt,
                    userId: response.data.message.userId,
                    content: response.data.message.content,
                    pinned: response.data.message.pinned || false,
                },
                username: response.data.username || "You",
            };
    
            setMessages((prevMessages) => [...prevMessages, formattedMessage]);
            lastMessageId.current = response.data.message.id; // Correctly update the last message ID
            setNewMessage(""); // Clear input field
    
            messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };
    

    // Initial setup
    useEffect(() => {
        verifyToken();
        fetchMessages();

        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [eventId]);

    return (
        <div
            className={styles.chatroomContainer}
            style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "10px" }}
        >
            <h2>Chat Room</h2>

            {/* Messages List */}
            <div
                style={{
                    height: "600px",
                    overflowY: "scroll",
                    border: "1px solid #ddd",
                    marginBottom: "10px",
                    padding: "10px",
                    borderRadius: "4px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                }}
            >
                {isLoading ? (
                    <p>Loading messages...</p>
                ) : messages.length > 0 ? (
                    messages.map((message) => (
                        <div
                            key={message.message.id}
                            style={{
                                alignSelf: message.username === username ? "flex-end" : "flex-start",
                                backgroundColor: message.username === username ? "#565654" : "#000",
                                padding: "8px",
                                borderRadius: "8px",
                                maxWidth: "70%",
                                textAlign: "left",
                            }}
                        >
                            <strong>{message.username}:</strong> {message.message.content} <br />
                            <small style={{ color: "#888" }}>
                                {new Date(message.message.createdAt).toLocaleTimeString()}
                            </small>
                        </div>
                    ))
                ) : (
                    <p>No messages yet.</p>
                )}
                {/* Auto-scroll reference */}
                <div ref={messageEndRef} />
            </div>

            {/* Input Field and Send Button */}
            <div style={{ display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: "1",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                    }}
                />
                <button
                    onClick={sendMessage}
                    style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#007BFF",
                        color: "#fff",
                        cursor: "pointer",
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatRoom;
