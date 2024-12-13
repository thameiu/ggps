"use client";
import React, { useEffect } from 'react';
import EventCard from '../../../components/eventCard';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

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

const EventPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [event, setEvent] = React.useState<Event | null>(null);

    const token = localStorage.getItem('token');
    console.log(token);
    if (!token) {
        router.push('/login');
    }

    const id = searchParams.get('id');
    console.log(id);

    useEffect(() => {
        const fetchEvent = async () => {
            if (id) {
                try {
                    const response = await axios.get(`http://localhost:9000/event/id/${id}`, {
                        headers: {
                            Authorization: token
                        }
                    });
                    setEvent(response.data); // Set the event state with the fetched data
                } catch (error: any) {
                    console.error(error);
                }
            }
        };
        fetchEvent();
    }, [id, token]);

    if (!event) {
        return <div>Loading...</div>;
    }

    const handleSignUp = (eventId: number) => {
        console.log(`Signed up for event ${eventId}`);
    };

    return (
        <div>
            <EventCard event={event} onSignUp={handleSignUp} />
        </div>
    );
};

export default EventPage;
