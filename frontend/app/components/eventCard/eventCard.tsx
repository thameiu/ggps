import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './event.module.css';
import ChatRoom from '../chatroom/chatroom';

export type Event = {
  id: number;
  title: string;
  description: string;
  beginDate: string;
  endDate: string;
  street: string;
  number: string;
  city: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  category: string;
};

type EventCardProps = {
  event: Event;
  organizer: string | null;
};

const EventCard: React.FC<EventCardProps> = ({ event, organizer }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignedUp, setIsSignedUp] = useState(false); 
  const [hasChatroom, setHasChatroom] = useState(false); 
  const [showChat, setShowChat] = useState(false);
  const [color, setColor] = useState<string | null>('');

  const handleSignUp = async (eventId: number) => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await axios.post(
        'http://localhost:9000/event/entry',
        {
          eventId,
          token: localStorage.getItem('token'),
          status: 'accepted',
        },
        {
          headers: {
            Authorization: localStorage.getItem('token'),
          },
        }
      );
      setSuccess(true);
      setIsSignedUp(true); 
      console.log('Sign-up successful:', response.data);
    } catch (err) {
      console.error('Error signing up:', err);
      setError('Failed to sign up. Please try again later.');
    } finally {
      setLoading(false);
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
          Authorization:  token,
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
            {event.category} {organizer ? 'created by ' + organizer : ''}
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
            <button
              onClick={() => handleSignUp(event.id)}
              disabled={loading || isSignedUp}
              className={styles.signUp}
              style={{
                backgroundColor: isSignedUp ? '#535352' : color || '#000',
              }}
            >
              {loading ? 'Signing Up...' : isSignedUp ? 'Signed Up  ✓' : 'Sign Up'}
            </button>

            {success && <p className="text-green-500">You have successfully signed up!</p>}
            {error && <p className="text-red-500">{error}</p>}
          </div>
        </div>
      }

      {/* Chatroom display */}
      {showChat && hasChatroom && isSignedUp && <ChatRoom event={event} color={color} />}
    </div>
  );
};

export default EventCard;
