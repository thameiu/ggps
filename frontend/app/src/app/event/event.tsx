"use client";
import React, { useEffect, useState } from 'react';
import EventCard from '../../../components/eventCard/eventCard';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Loader from '../../../components/loader/loader';

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
    const [organizer, setOrganizer] = React.useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        setToken(savedToken);

        if (!savedToken) {
            router.push('/login');
        }
    }, [router]);

    const id = searchParams.get('id');

    useEffect(() => {
        const fetchEvent = async () => {
            if (id && token) {
                try {
                    const response = await axios.get(`http://localhost:9000/event/id/${id}`, {
                        headers: {
                            Authorization: token
                        }
                    });
                    setEvent(response.data.event); // Set the event state with the fetched data
                    setOrganizer(response.data.organizer); // Set the event state with the fetched data

                } catch (error: any) {
                    console.error(error);
                }
            }
        };
        fetchEvent();
    }, [id, token]);
    

    useEffect(() => {
        if (typeof window === "undefined") return;

        const canvas = document.getElementById("topo-canvas") as HTMLCanvasElement | null;

        // Check if the canvas element exists before proceeding
        if (!canvas) {
            console.error("Canvas element not found");
            return;
        }

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const lines: { y: number; speed: number }[] = [];
        const numLines = 30; // Number of topographical layers
        const lineSpacing = 40; // Spacing between layers

        // Initialize lines
        for (let i = 0; i < numLines; i++) {
            lines.push({
                y: i * lineSpacing,
                speed: Math.random() * 0.5 + 0.1, // Slower speeds
            });
        }

        // Draw topographical lines
        function drawLines() {
            if (!ctx ||!canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (event && event.category.toLowerCase() === 'convention')
                ctx.strokeStyle = "rgba(100, 0, 200, 0.7)";
            else if (event && (event.category.toLowerCase() === 'tournament' || event.category.toLowerCase() === 'esport event'))
                ctx.strokeStyle = "rgba(137, 0, 0, 0.7)";
            else if (event && event.category.toLowerCase() === 'lan')
                ctx.strokeStyle = "rgba(0, 0, 137, 0.7)";
            else if (event && event.category.toLowerCase() === 'speedrunning event')
                ctx.strokeStyle = "rgba(0, 137, 0, 0.7)";
            else ctx.strokeStyle = "rgba(86, 86, 84, 0.7)";
            
             
            ctx.lineWidth = 2;

            lines.forEach((line) => {
                ctx.beginPath();
                for (let x = 0; x < canvas.width; x += 10) {
                    const yOffset = Math.sin((x + line.y) / 100) * 20; // Wave-like effect
                    ctx.lineTo(x, line.y + yOffset);
                }
                ctx.stroke();

                // Move the line upwards
                line.y -= line.speed;
                if (line.y < -lineSpacing) {
                    line.y = canvas.height + lineSpacing; // Loop back to the bottom
                }
            });
        }

        function animate() {
            drawLines();
            requestAnimationFrame(animate);
        }

        animate();

        document.title = event?.title ? event.title : "Event Page";
        
        return () => {
            window.removeEventListener("resize", resizeCanvas);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

    }, [event]); 

    if (!event) {
        return <Loader/>;
    }

    return (
        <div>
            <canvas id="topo-canvas" className="fixed inset-0 -z-10"
                style={{
                    overflow: "hidden",
                }}></canvas>
            <EventCard event={event} organizer={organizer?organizer:''} />
        </div>
    );
};

export default EventPage;
