import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './event.module.css';
import Chatroom from '../chatroom/chatroom';
import { EventCardProps } from './types';
import Modal from '../modal/Modal';

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

  const confirmDeleteEvent = () => {
    setShowDeleteModal(true);
  };

  const confirmRemoveEntry = () => {
    setShowRemoveEntryModal(true);
  };

  const handleEntryAction = async (eventId: number) => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated.');
      }

      if (isSignedUp) {
        setShowRemoveEntryModal(false);
        // Remove entry
        await axios.delete('http://localhost:9000/event/entry', {
          data: {
            eventId,
            token,
          },
          headers: {
            Authorization: token,
          },
        });
        setIsSignedUp(false);
        console.log('Entry removed successfully');
      } else {
        // Sign up for event
        await axios.post(
          'http://localhost:9000/event/entry',
          {
            eventId,
            token,
            status: 'accepted',
          },
          {
            headers: {
              Authorization: token,
            },
          }
        );
        setIsSignedUp(true);
        console.log('Sign-up successful');
      }
      setSuccess(true);
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update entry. Please try again later.');
    } finally {
      setLoading(false);
    }
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
  
      // Delete event
      await axios.delete(`http://localhost:9000/event`, {
        data: {
          token,
          eventId,
        },
        headers: {
          Authorization: token,
        },
      });
  
      console.log('Event deleted successfully');
      setSuccess(true);

    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete the event. Please try again later.');
    } finally {
      setLoading(false);
      window.location.href = '/map';
    }
  };
  

  const checkSignUpStatus = async (eventId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:9000/event/userEntries', {
        params: {
          token: token,
        },
        headers: {
          Authorization: token,
        },
      });

      const { events, organizedEvents } = response.data;
      const isUserSignedUp =
        events.some((e: { id: number }) => e.id === eventId) ||
        organizedEvents.some((e: { id: number }) => e.id === eventId);

      setIsSignedUp(isUserSignedUp);
    } catch (err) {
      console.error('Error checking sign-up status:', err);
    }
  };

  const checkOrganizerStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:9000/auth/verify-token',
        {},
        { headers: { authorization: token } }
      );

      const loggedInUser = response.data.user.username;
      console.log(loggedInUser, organizer);
      if (loggedInUser == organizer) {
        setIsOrganizer(true);
      }
      } catch (err) {
      console.error('Error verifying organizer status:', err);
    }
  };

  const checkChatroomAvailability = async (eventId: number) => {
    try {
      await axios.get(`http://localhost:9000/chat/${eventId}/messages`, {
        headers: {
          Authorization: localStorage.getItem('token'),
        },
      });
      setHasChatroom(true);
    } catch (err) {
      console.error('No chatroom found for this event.');
      setHasChatroom(false);
    }
  };

  function selectColor() {
    if (event && event.category.toLowerCase() === 'convention') setColor('rgba(100, 0, 200, 1)');
    else if (event && (event.category.toLowerCase() === 'tournament' || event.category.toLowerCase() === 'esport event'))
      setColor('rgba(219, 39, 39, 1)');
    else if (event && event.category.toLowerCase() === 'lan') setColor('rgba(80, 80, 255, 0.7)');
    else if (event && event.category.toLowerCase() === 'speedrunning event') setColor('rgba(39, 219, 39, 0.7)');
    else setColor('rgba(86, 86, 84, 0.7)');
  }

  useEffect(() => {
    selectColor();
    checkSignUpStatus(event.id);
    checkChatroomAvailability(event.id);
    checkOrganizerStatus();
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
              <>
                created by{" "}
                <a href={`/profile?username=${organizer}`}>
                  <span className={styles.organizerLink}>{organizer}</span>
                </a>
              </>
            ) : (
              ""
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
          {isOrganizer ? (
            <button
              onClick={() => confirmDeleteEvent()}
              className={styles.deleteButton}

            >
              {loading ? 'Processing...' : 'Delete Event'}
            </button>
          ) : (
            <button
              onClick={() => isSignedUp ? confirmRemoveEntry() : handleEntryAction(event.id)}
              className={styles.signUp}
              style={{
                backgroundColor: isSignedUp ? '#535352' : color || '#000',
              }}
            >
              {loading ? 'Processing...' : isSignedUp ? 'Remove Entry' : 'Sign Up'}
            </button>
          )}

          {success && (
            <p className={styles.status} style={{ animation: 'fadeOut 3s forwards' }}>
              {isOrganizer ? 'Event deleted successfully!' : isSignedUp ? 'Entry added successfully!' : 'Entry removed successfully!'}
            </p>
          )}
          {error && (
            <p className={styles.status} style={{ animation: 'fadeOut 3s forwards' }}>
              {error}
            </p>
          )}

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
          onConfirm={() => handleEntryAction(event.id)}
          onCancel={() => setShowRemoveEntryModal(false)}
        />
      )}

      {/* Chatroom display */}
      {showChat && hasChatroom && isSignedUp && <Chatroom event={event} color={color} />}
    </div>
  );
};

export default EventCard;
