import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './event.module.css';
import Chatroom from '../chatroom/chatroom';
import { EventCardProps } from './types';
import Modal from '../modal/Modal';
import {useRouter} from 'next/navigation';
import { handleEntryAction, checkChatroomAvailability, checkOrganizerStatus, checkSignUpStatus,selectColor } from './eventUtils';
import Image from 'next/image';
import 'animate.css';
import { kMaxLength } from 'buffer';

const EventCard: React.FC<EventCardProps> = ({ event, organizer }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [hasChatroom, setHasChatroom] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [color, setColor] = useState<string | null>('');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveEntryModal, setShowRemoveEntryModal] = useState(false);
  const [organizerProfilePicture, setOrganizerProfilePicture] = useState<string | null>(null);
  const [participants, setParticipants] = useState<{ id: number; username:string; firstName: string; lastName: string; status: string, role?:string }[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const router = useRouter();

  const confirmDeleteEvent = () => {
    setShowDeleteModal(true);
  };

  const confirmRemoveEntry = () => {
    setShowRemoveEntryModal(true);
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
  
      setSuccess(true);

    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete the event. Please try again later.');
    } finally {
      setLoading(false);
      window.location.href = '/map';
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
        // alert(`User ${username} updated to ${newRole}`);
        fetchParticipants();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update role.');
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

  const toggleParticipants = () => {
    if (!showParticipants) {
      fetchParticipants();
    }
    setShowParticipants(!showParticipants);
  };



  useEffect(() => {
    selectColor(event, setColor);
    checkOrganizerStatus(organizer, setIsOrganizer);
    checkSignUpStatus(event.id, setIsSignedUp);
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

    
                onClick={async () => {isSignedUp ? confirmRemoveEntry() : await handleEntryAction(event.id,isSignedUp,setLoading,setSuccess, setError,setIsSignedUp,setShowRemoveEntryModal);fetchParticipants();}}
                className={styles.signUp}
                style={{
                  backgroundColor: isSignedUp ? '#535352' : color || '#000',
                }}
              >
                {loading ? 'Processing...' : isSignedUp ? 'Remove Entry' : 'Sign Up'}
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
          {isSignedUp || isOrganizer ? (
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
              <ul className={`${styles.participantsList} animate__animated animate__fadeIn`}>
                {participants.map((participant) => (
                  <li className={styles.participantItem} key={participant.id}>
                    <a className={styles.participantLink} 
                      style={{
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/profile?username=${participant.username}`);
                      }}
                    >
                      <img
                        src={`http://localhost:9000/user/${participant.username}/profile-picture`}
                        className={styles.participantPicture}
                        alt={`${participant.username}'s profile`}
                        onError={(e) => {
                            e.currentTarget.src = "/images/usericon.png";
                        }}
                      ></img>
                      <div className={styles.participantUsername}>{participant.username}</div>
                      <div className={styles.participantName}>{participant.firstName??'N/A'} {participant.lastName??'N/A'} </div>{' '}
                      <div className={styles.participantStatus} style={{
                        color: color || undefined,
                      }}>{participant.status}</div>
                    </a>
                    {/* Role Selector */}
                    {(isOrganizer && participant.role!=='organizer') && (
                    <select 
                      className={styles.roleSelector} 
                      value={participant.role || 'member'} 
                      onChange={(e) => handleRoleChange(e, participant.username)}
                    >
                      <option value="write">Write</option>
                      <option value="read">Read only</option>
                      <option value="admin">Admin</option>
                    </select>
                    )}
                  </li>
                ))}
              </ul>
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
            await handleEntryAction(event.id, isSignedUp, setLoading, setSuccess, setError, setIsSignedUp, setShowRemoveEntryModal);
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
