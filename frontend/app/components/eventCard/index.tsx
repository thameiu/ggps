import React from 'react';
import styles from './event.module.css';


type Event = {
    id: number;
    title: string;
    description: string;
    beginDate: string; // or Date, depending on how you handle dates
    endDate: string; // or Date, depending on how you handle dates
    street:string;
    number:string;
    city:string;
    zipCode:string;
    latitude: number;
    longitude:number;
    category: string;

};

type EventCardProps = {
  event: Event;
  onSignUp: (id: number) => void;
};

const EventCard: React.FC<EventCardProps> = ({ event, onSignUp }) => {
  return (
    <div className={styles.eventCard}>
        <h2 className={styles.title}>{event.title}</h2>
        <div className={styles.subtitle}>created by <h2 className={styles.username}>John Doe</h2></div>

        
      <div className="mb-4">
        <p className="text-sm text-gray-400">{event.category}</p>
      </div>

      <div className="mb-4">
        <p className="text-gray-300 text-sm">{event.description}</p>
      </div>

      <div className={styles.dates}>
          <p><strong>From :</strong> {new Date(event.beginDate).toLocaleDateString()}</p>
          <p><strong>To :</strong> {new Date(event.endDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p><strong>Location:</strong> {event.number} {event.street} {event.city} {event.zipCode} </p>
        </div>
      <div className="flex justify-between items-center">
        
        <button
          onClick={() => onSignUp(event.id)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default EventCard;
