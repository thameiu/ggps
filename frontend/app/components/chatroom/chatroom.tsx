"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "./chatroom.module.css";
import { Event } from "../eventCard/eventCard";

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

const ChatRoom: React.FC<ChatRoomProps> = ({ event, color }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [username, setUsername] = useState<string | null>(null);

    const token = localStorage.getItem("token");
    const lastMessageId = useRef<number | null>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initializeChat = async () => {
            await verifyToken();
            fetchMessages();
        };

        initializeChat();

        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [event.id]);

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

    const fetchMessages = async () => {
        try {
            const response = await axios.get(
                `http://localhost:9000/chat/${event.id}/messages`,
                {
                    headers: { Authorization: token },
                }
            );

            const newMessages = response.data.filter((msg: Message) => {
                return (
                    lastMessageId.current === null ||
                    msg.message.id > lastMessageId.current
                );
            });

            if (newMessages.length > 0) {
                setMessages((prevMessages) => [...prevMessages, ...newMessages]);

                const latestMessageId =
                    newMessages[newMessages.length - 1].message.id;
                lastMessageId.current = latestMessageId;

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
                { token, eventId: event.id, content: newMessage },
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
            lastMessageId.current = response.data.message.id;
            setNewMessage("");

            messageEndRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    return (
        <div className={styles.chatroomContainer}>
            <h2 className={styles.eventTitle}>{event.title} - chat</h2>

            {/* Messages List */}
            <div
                className={styles.messagesContainer}
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
                    scrollbarColor: color || "#fff",
                }}
            >
                {isLoading ? (
                    <p>Loading messages...</p>
                ) : messages.length > 0 ? (
                    messages.map((message) => (
                        <div
                            key={message.message.id}
                            style={{
                                alignSelf:
                                    message.username === username
                                        ? "flex-end"
                                        : "flex-start",
                                backgroundColor:
                                    message.username === username
                                        ? "#565654"
                                        : "#000",
                                padding: "8px",
                                borderRadius: "8px",
                                maxWidth: "70%",
                                textAlign: "left",
                            }}
                        >
                            <p className={styles.username}>{message.username}:</p>
                            {message.message.content} <br />
                            <small style={{ color: "#888" }}>
                                {new Date(
                                    message.message.createdAt
                                ).toLocaleTimeString()}
                            </small>
                        </div>
                    ))
                ) : (
                    <p>No messages yet.</p>
                )}
                <div ref={messageEndRef} />
            </div>

            {/* Input Field and Send Button */}
            <div style={{ display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className={styles.inputField}
                />
                <button
                    onClick={sendMessage}
                    style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: color || "#000",
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
