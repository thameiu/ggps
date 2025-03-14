"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "./chatroom.module.css";
import { Event } from "../eventCard/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack, faThumbTackSlash } from "@fortawesome/free-solid-svg-icons";
import io from "socket.io-client";
import Loader from "../loader/loader";

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
    const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [cannotRead, setCannotRead] = useState<boolean>(false);
    const [cannotWrite, setCannotWrite] = useState<boolean>(false);



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

                    if (newMessages.length > 0) {
                        setMessages((prevMessages) => [...prevMessages, ...newMessages]);
                        setFilteredMessages((prevMessages) => [...prevMessages, ...newMessages]);

                        const latestMessageId = newMessages[newMessages.length - 1].message.id;
                        lastMessageId.current = latestMessageId;
                    }

                    scrollToBottom();
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

        socket.on("receiveMessage", (message: Message) => {
            if (!messages.some((msg) => msg.message.id === message.message.id)) {
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages, message];
                    setFilteredMessages(updatedMessages.filter(msg => !showPinnedOnly || msg.message.pinned));


                    return updatedMessages;
                });
            }
        });

        socket.on("messagePinned", (updatedMessage: Message) => {
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    message.message.id === updatedMessage.message.id
                        ? { ...message, message: updatedMessage.message }
                        : message
                )
            );

                if (!showPinnedOnly) {
                    setFilteredMessages((prevMessages) =>
                        prevMessages.map((message) =>
                            message.message.id === updatedMessage.message.id
                                ? { ...message, message: updatedMessage.message }
                                : message
                        )
                    );
                } else {
                    setFilteredMessages((prevMessages) =>
                        prevMessages.filter((msg) => msg.message.pinned)
                    );
                }
        });

        return () => {
            socket.emit("leaveChatroom", { eventId: event.id });
            socket.off("sendMessage");
            socket.off("pinMessage");
            socket.off("receiveMessage");
            socket.off("messagePinned");

            
        };
    }, [event.id, showPinnedOnly]);

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
    
    useEffect(() => {
        if (showPinnedOnly) {
            setFilteredMessages(messages.filter((msg) => msg.message.pinned));
        } else {
            setFilteredMessages([...messages]);
        }
    }, [showPinnedOnly, messages]);
    

    const handleMessageClick = (messageId: number) => {
        setSelectedMessageId((prev) => (prev === messageId ? null : messageId));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 className={styles.eventTitle}>{event.title} - chat</h2>
                <button
                    className={styles.showPinnedButton}
                    onClick={toggleShowPinned}
                    style={{
                        backgroundColor: color || "#000",
                    }}
                >
                    <FontAwesomeIcon icon={showPinnedOnly?faThumbTackSlash:faThumbtack} />
                                      
                </button>
            </div>

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

                                {/* Show createdAt when the message is clicked */}
                                {selectedMessageId === message.message.id && (
                                    <small
                                        style={{
                                            color: "#888",
                                            display: "block",
                                            marginTop: "8px",
                                            textAlign: message.username === username ? "right" : "left",
                                        }}
                                    >
                                        {new Date(message.message.createdAt).toLocaleTimeString()}
                                    </small>
                                )}
                            </div>
                        </div>

                    ))
                ) : showPinnedOnly ? (
                    <p className={styles.noMessages}>No pinned messages yet.</p>
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