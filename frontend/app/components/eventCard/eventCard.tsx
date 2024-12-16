import React, { useState } from 'react';
import axios from 'axios'; 
import styles from './event.module.css';

type Event = {
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

const EventCard: React.FC<EventCardProps> = ({ event,organizer }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (eventId: number) => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await axios.post('http://localhost:9000/event/addEntry',
       { eventId,
        token:localStorage.getItem('token'),
        status:'accepted',
        }
      , {
        headers: {
          Authorization: localStorage.getItem('token'), 
        },
      }
      
      ); 
      setSuccess(true);
      console.log('Sign-up successful:', response.data);
    } catch (err) {
      console.error('Error signing up:', err);
      setError('Failed to sign up. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.eventCard}>
      <h2 className={styles.title}>{event.title}</h2>
      <div className={styles.subtitle}>{event.category} {organizer?'created by '+organizer:''}</div>

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
          disabled={loading}
          className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>

        {success && <p className="text-green-500">You have successfully signed up!</p>}
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default EventCard;
