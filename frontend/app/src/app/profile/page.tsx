"use client";
import { useRouter,useSearchParams } from "next/navigation";
import Profile from "../../../components/profile/Profile";
import Loader from "../../../components/loader/loader";
import { useEffect } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");
  

  if (!username) {
    return <Loader/>;
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
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(86, 86, 84, 0.7)";
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
  
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);


   
  return (
    <div>
        <canvas id="topo-canvas" className="fixed inset-0 -z-10"
      style={{
          overflow: "hidden",
      }}></canvas>
      <Profile username={username as string} />
    </div>
  );
}
