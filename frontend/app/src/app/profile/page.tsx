"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Profile from "../../../components/profile/Profile";
import Loader from "../../../components/loader/loader";
import { useEffect } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

  if (!username) {
    return <Loader />;
  }

  useEffect(() => {
    const canvas = document.getElementById("topo-canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const lines: { y: number; speed: number }[] = [];
    const numLines = 30;
    const lineSpacing = 40; 

    const generateColor = (input: string) => {
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
      }
      const r = (hash >> 16) & 0xff;
      const g = (hash >> 8) & 0xff;
      const b = hash & 0xff;
      return `rgba(${r}, ${g}, ${b}, 0.7)`; 
    };

    const strokeColor = generateColor(username);

    for (let i = 0; i < numLines; i++) {
      lines.push({
        y: i * lineSpacing,
        speed: Math.random() * 0.5 + 0.1, 
      });
    }

    // Draw topographical lines
    function drawLines() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;

      lines.forEach((line) => {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
          const yOffset = Math.sin((x + line.y) / 100) * 20; 
          ctx.lineTo(x, line.y + yOffset);
        }
        ctx.stroke();

        line.y -= line.speed;
        if (line.y < -lineSpacing) {
          line.y = canvas.height + lineSpacing;
        }
      });
    }

    function animate() {
      drawLines();
      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [username]);

  return (
    <div>
      <canvas
        id="topo-canvas"
        className="fixed inset-0 -z-10"
        style={{
          overflow: "hidden",
        }}
      ></canvas>
      <Profile username={username as string} />
    </div>
  );
}
