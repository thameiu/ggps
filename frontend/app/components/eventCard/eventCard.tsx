import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import styles from './event.module.css';
import Chatroom from '../chatroom/chatroom';
import { EventCardProps } from './types';
import Modal from '../modal/Modal';
import {useRouter} from 'next/navigation';
import io from "socket.io-client";

import { handleEntryAction, checkChatroomAvailability, checkOrganizerStatus, checkSignUpStatus,selectColor } from './eventUtils';
import Image from 'next/image';
import 'animate.css';
import { kMaxLength } from 'buffer';

const EventCard: React.FC<EventCardProps> = ({ event, organizer }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isPending, setIsPending] = useState(false);


  const [isAdmin, setIsAdmin] = useState(false);

  const [hasChatroom, setHasChatroom] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [color, setColor] = useState<string | null>('');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveEntryModal, setShowRemoveEntryModal] = useState(false);
  const [showRemoveUserEntryModal, setShowRemoveUserEntryModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string|null>(null);
  const [organizerProfilePicture, setOrganizerProfilePicture] = useState<string | null>(null);
  const [participants, setParticipants] = useState<{ id: number; username:string; firstName: string; lastName: string; status: string, role?:string }[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  
  // New state for filtering participants
  const [participantSearch, setParticipantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const router = useRouter();

  const socket = useRef(io("http://127.0.0.1:9000")).current;
  
  // Apply filters to participants
  const filteredParticipants = participants.filter(participant => {
    // Search by username
    const matchesSearch = participant.username.toLowerCase().includes(participantSearch.toLowerCase()) ||
      (participant.firstName && participant.firstName.toLowerCase().includes(participantSearch.toLowerCase())) ||
      (participant.lastName && participant.lastName.toLowerCase().includes(participantSearch.toLowerCase()));
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    
    // Filter by role
    const matchesRole = roleFilter === 'all' || participant.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });
  
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    // Socket event listeners
    socket.emit('joinRoom', event.id); // Join the room

    // HERE

    socket.on('joinedChatroom', (data:any) => {
      console.log(data);
    });

    socket.on('participantsUpdateReceived', (data:any) => {

      setParticipants(data);
      recheckEntryStatus(data);
      // }
    });
  
    socket.on('eventDeleted', (data:any) => {
      router.push('/map');
    });

    return () => {
      // Cleanup on unmount
      socket.off('participantsUpdateReceived');
      socket.off('joinRoom');
      socket.off('eventDeleted');
    };
  }, [event.id, username]); // 

  const confirmDeleteEvent = () => {
    setShowDeleteModal(true);
  };

  const confirmRemoveEntry = () => {
    setShowRemoveEntryModal(true);
  };

  const confirmRemoveUserEntry = () => {
    setShowRemoveUserEntryModal(true);
  };


  const handleDeleteEvent = async (eventId: number) => {
    setShowDeleteModal(false);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated.');
      }

      await axios.delete(`http://localhost:9000/event`, {
        data: {
          token,
          eventId,
        },
        headers: {
          Authorization: token,
        },
      });

      socket.emit('deleteEvent', eventId);
      setSuccess(true);

    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete the event. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>, username: string) => {
    const newRole = e.target.value;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated.');
      }

      const response = await axios.put('http://localhost:9000/chat/access', {
        token,
        eventId: event.id.toString(),
        role: newRole,
        username: username,
      }, {
        headers: { Authorization: token },
      });

      if (response.status === 200) {
        socket.emit('participantsUpdate', event.id); 
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update role.');
    }
  };

  const handleRemoveEntry = async (username: string) => {
    setSelectedParticipant(null);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated.');
      }

      await axios.delete('http://localhost:9000/event/entry/user', {
        data: {
          token,
          username,
          eventId: event.id.toString(),
        },
        headers: { Authorization: token },
      });
      
      socket.emit('participantsUpdate', event.id); // Emit user removal via WebSocket
      setSuccess(true);
    } catch (err) {
      console.error('Error removing user entry:', err);
      setError('Failed to remove user entry. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId: number, username: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found.');
        return;
      }

      const response = await axios.put('http://localhost:9000/event/entry/user', {
        token,
        username,
        eventId: eventId.toString(),
        status
      }, {
        headers: { Authorization: token }
      });
      socket.emit('participantsUpdate', event.id); // Emit status update via WebSocket
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error updating user status:', error.response?.data || error.message);
      } else {
        console.error('Error updating user status:', error);
      }
    }
  };
  const fetchOrganizerProfilePicture = async (username: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User not authenticated.');


      const response = await axios.get(
        `http://localhost:9000/user/${username}`,
        {
          headers: { Authorization: token },
        }
      );

      if (response.status !== 200 || !response.data.profilePicture) {
        setOrganizerProfilePicture('/images/usericon.png');
        return;
      }
      
      setOrganizerProfilePicture('http://localhost:9000'+response.data.profilePicture);
    } catch (err) {
      console.error('Failed to fetch organizer profile picture:', err);
      setOrganizerProfilePicture('/images/usericon.png');
    }
  };

  

  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User not authenticated.');

      const response = await axios.get(
        `http://localhost:9000/event/entries/${event.id}`,
        { headers: { Authorization: token } }
      );

      setParticipants(response.data);
      console.log(response.data);

    } catch (err) {
      console.error('Failed to fetch participants:', err);
    }
  };

  const recheckEntryStatus = (data:any) => {
    const currentUserEntry = data.find((participant: any) => participant.username === username);
    console.log(currentUserEntry);
    if (!currentUserEntry) {
      setIsBanned(false);
      setIsPending(false);
      setIsAdmin(false);
      setIsSignedUp(false);
    } else if (currentUserEntry.status === 'pending') {
      setIsAdmin(false);
      setIsBanned(false);
      setIsPending(true);
    } else if (currentUserEntry.status === 'banned') {
      setIsAdmin(false);
      setIsPending(false);
      setIsBanned(true);
      
    } else if (currentUserEntry.status === 'admin') {
      setIsBanned(false);
      setIsPending(false);
      setIsAdmin(true);
      
    }  else if (currentUserEntry.status === 'accepted') {
      setIsBanned(false);
      setIsPending(false);
      setIsAdmin(false);
      
    }
    
    
  }

  const toggleParticipants = () => {
    if (!showParticipants) {
      fetchParticipants();
    }
    setShowParticipants(!showParticipants);
  };

  // Reset filters function
  const resetFilters = () => {
    setParticipantSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
  };


  useEffect(() => {
    selectColor(event, setColor);
    checkOrganizerStatus(organizer, setIsOrganizer, setUsername);
    checkSignUpStatus(event.id, setIsSignedUp, setIsAdmin, setIsBanned, setIsPending);
    checkChatroomAvailability(event.id, setHasChatroom);
    fetchParticipants();
    if (organizer) {
      fetchOrganizerProfilePicture(organizer);
    }

  }, [event.id, event.category]);



  return (
    <div className={styles.eventCard}>
      {/* Tab navigation */}
      {hasChatroom && isSignedUp && 
        <div className={styles.tabContainer}>
          <span
            onClick={() => setShowChat(false)}
            className={`${styles.tab} ${!showChat ? styles.activeTab : ''}`}
            style={{
              color: showChat ? '#fff' : color || '#fff',
            }}
          >
            Event
          </span>
          <span
            onClick={() => setShowChat(true)}
            className={`${styles.tab} ${showChat ? styles.activeTab : ''}`}
            style={{
              color: !showChat ? '#fff' : color || '#fff',
            }}
          >
            Chatroom
          </span>

          {/* Sliding underline */}
          <div
            className={styles.underline}
            style={{
              transform: `translateX(${showChat ? '100%' : '0px'})`, 
              backgroundColor: color || '#fff',
            }}
          />
        </div>
      }

      { !showChat &&
        <div className={styles.eventInfo}>
          <h2 className={styles.title}>{event.title}</h2>
          <div className={styles.subtitle}>
            {event.category}{" "}
            {organizer ? (
              <div className={styles.organizerContainer}>
                created by{' '}
                <img
                  src={organizerProfilePicture || '/images/usericon.png'}
                  alt={`${organizer}'s profile`}
                  className={styles.organizerPicture}
                  width={50}
                  height={50}
                />
                {' '}
                
                <a 
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/profile?username=${organizer}`);
                  }
                }>
                  <span className={styles.organizerLink}>{organizer}</span>
                </a>
              </div>
            ) : (
              ''
            )}
          </div>
          <div className="mb-4">
            <p className={styles.description}>{event.description}</p>
          </div>

          <div className={styles.dates}>
            <p>
              <strong>From :</strong> {new Date(event.beginDate).toLocaleDateString()}
            </p>
            <p>
              <strong>To :</strong> {new Date(event.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p>
              <strong>Location:</strong> {event.number} {event.street} {event.city} {event.zipCode}
            </p>
          </div>



          <div className="flex flex-col space-y-2">
          { event.beginDate > new Date().toISOString() ?(
            isOrganizer ? (
              <button
                onClick={() => confirmDeleteEvent()}
                className={styles.deleteButton}

              >
                {loading ? 'Processing...' : 'Delete Event'}
              </button>
            ) : (
              
              <button

    
                onClick={async () => {isSignedUp ? confirmRemoveEntry() : await handleEntryAction(event.id,isSignedUp,setLoading,setSuccess, setError,setIsSignedUp,setShowRemoveEntryModal,setIsPending,socket);fetchParticipants();}}
                className={styles.signUp}
                style={{
                  backgroundColor: isSignedUp ? '#535352' : color || '#000',
                }}
                disabled={isBanned || isPending}
              >
                {isBanned ? 'You are banned from this event' : isPending ? 'Your entry is pending approval' : ''}

                {!isBanned && !isPending && (
                  <>
                    {loading ? 'Processing...' : isSignedUp ? 'Remove Entry' : 'Sign Up'}
                  </>
                )}
              </button>

              
            )
          ):
          <div className={styles.signUp}
          style={{
            backgroundColor: '#535352',
            width: '25%'
          }}
          >This event has already ended.</div>}
          {error && (
            <p className={styles.status} style={{ animation: 'fadeOut 3s forwards' }}>
              {error}
            </p>
          )}

          {/* Participants Section */}
          {(isSignedUp || isOrganizer) && (!isBanned && !isPending)  ? (
          <div className={styles.participantsSection}>
            <button
              className={styles.toggleParticipantsButton}
              onClick={toggleParticipants}
            >
              <div className={styles.participantTitle}>
              {showParticipants
                ? 'Hide Participants'
                : `Show Participants (${participants.length})`}
                </div>
            </button>

            {showParticipants && (
            <div className={styles.participantsContainer}>
              {/* Search and Filter UI */}
              <div className={styles.participantFilters}>
                {/* Search Bar */}
                <div className={styles.searchInputContainer}>
                  <input
                    type="text"
                    placeholder="Search by name or username..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className={styles.participantSearchInput}
                  />
                </div>
                
                <div className={styles.filtersGroup}>
                  {/* Status Filter */}
                  <div className={styles.filterItem}>
                    <label htmlFor="statusFilter" className={styles.filterLabel}>Status:</label>
                    <select
                      id="statusFilter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Statuses</option>
                      <option value="accepted">Accepted</option>
                      <option value="pending">Pending</option>
                      <option value="banned">Banned</option>
                      <option value="admin">Admin</option>
                      <option value="organizer">Organizer</option>
                    </select>
                  </div>
                  
                  {/* Role Filter */}
                  <div className={styles.filterItem}>
                    <label htmlFor="roleFilter" className={styles.filterLabel}>Role:</label>
                    <select
                      id="roleFilter"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Roles</option>
                      <option value="write">Write</option>
                      <option value="read">Read Only</option>
                      <option value="admin">Admin</option>
                      <option value="none">None</option>
                      <option value="organizer">Organizer</option>
                    </select>
                  </div>
                  
                  {/* Reset Button */}
                  <button 
                    onClick={resetFilters}
                    className={styles.resetFiltersButton}
                  >
                    Reset
                  </button>
                </div>
                
                {/* Results Count */}
                <div className={styles.resultsCount}>
                  Showing {filteredParticipants.length} of {participants.length} participants
                </div>
              </div>

              {/* Participants List - Now using filteredParticipants instead of participants */}
              <ul className={`${styles.participantsList} animate__animated animate__fadeIn`}>
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((participant) => (
                    <li className={styles.participantItem} key={participant.id}>
                      {/* Profile Picture */}
                      <img
                        src={`http://localhost:9000/user/${participant.username}/profile-picture`}
                        className={styles.participantPicture}
                        alt={`${participant.username}'s profile`}
                        onError={(e) => {
                          e.currentTarget.src = "/images/usericon.png";
                        }}
                      />

                      {/* Username (Clickable) */}
                      <a
                        className={styles.participantLink}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/profile?username=${participant.username}`);
                        }}
                      >
                        <div className={styles.participantUsername}>{participant.username}</div>
                      </a>

                      {/* Full Name */}
                      <div className={styles.participantName}>
                        {participant.firstName ?? "N/A"} {participant.lastName ?? "N/A"}
                      </div>

                      {/* Status (Dropdown for organizers/admins, Text for others) */}
                      {(isOrganizer || isAdmin) && participant.role !== "organizer" && participant.status !== "organizer" && participant.username !== username ? (
                        <select
                          className={styles.statusSelector}
                          value={participant.status}
                          onChange={(e) => handleStatusChange(event.id, participant.username, e.target.value)}
                        >
                          <option value="accepted">Accepted</option>
                          <option value="pending">Pending</option>
                          <option value="banned">Banned</option>
                          {isOrganizer && <option value="admin">Admin</option>}
                        </select>
                      ) : (
                        <div className={styles.participantStatus}>{participant.status}</div>
                      )}

                      {/* Role Selector (Only for Organizers) */}
                      {(isOrganizer || isAdmin)  && participant.role !== "organizer" && participant.status !== "organizer" && participant.username !== username  && (
                        <select
                          disabled={participant.status === "banned" || participant.status === "pending"}
                          className={styles.roleSelector}
                          value={participant.role || "member"}
                          onChange={(e) => handleRoleChange(e, participant.username)}
                        >
                          <option value="none">None</option>
                          <option value="write">Write</option>
                          <option value="read">Read only</option>
                          {isOrganizer && <option value="admin">Admin</option>}

                        </select>
                      )}

                      {/* Delete Button (For Organizers/Admins) */}
                      {(isOrganizer || isAdmin) &&
                        participant.role !== "organizer" &&
                        participant.status !== "organizer "&& 
                        participant.username !== username && (
                          <button
                            className={styles.trashButton}
                            onClick={() => setSelectedParticipant(participant.username)}
                          >
                            ❌
                          </button>
                        )}
                    </li>
                  ))
                ) : (
                  <li className={styles.noResults}>No participants match your filters</li>
                )}
              </ul>
            </div>
          )}

          </div>
          ):''}

          <style jsx>{`
            @keyframes fadeOut {
              0% {
                opacity: 1;
              }
              100% {
                opacity: 0;
              }
            }
          `}</style>
        </div>

        </div>
      }

        {selectedParticipant && (
        <Modal
          title="Confirm Removal"
          message={`Are you sure you want to remove ${selectedParticipant} from this event?`}
          confirmText="Remove"
          cancelText="Cancel"
          onCancel={() => setSelectedParticipant(null)}
          onConfirm={() => handleRemoveEntry(selectedParticipant)}
        >
        </Modal>
      )}
      
      {showDeleteModal && (
        <Modal
          title="Delete Event"
          message="Are you sure you want to delete this event? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"

          onConfirm={() => handleDeleteEvent(event.id)}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showRemoveEntryModal && (
        <Modal
          title="Remove Entry"
          message="Are you sure you want to remove your entry for this event?"
          confirmText="Remove"
          cancelText="Cancel"
            onConfirm={async () => {
            await handleEntryAction(event.id, isSignedUp, setLoading, setSuccess, setError, setIsSignedUp, setShowRemoveEntryModal,setIsPending,socket);
            fetchParticipants();
            }}
          onCancel={() => setShowRemoveEntryModal(false)}
        />
      )}

      {/* Chatroom display */}
      {showChat && hasChatroom && isSignedUp && <Chatroom event={event} color={color} />}
    </div>
  );
};

export default EventCard;