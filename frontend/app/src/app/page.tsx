"use client"
import { useEffect } from "react";
import Image from "next/image";
import styles from './home.module.css';
import 'animate.css';

export default function Home() {
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
      ctx.strokeStyle = "rgba(137, 0, 0, 0.7)";
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
    
    <div className="grid items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] homeBody" 
    style={{
      overflow: "hidden",
        }}
    
>
      {/* Canvas for topographical animation */}
      <canvas id="topo-canvas" className="fixed inset-0 -z-10"
      
      style={{
        overflow: "hidden",
      }}></canvas>
      
      <main className="flex flex-col gap-8 row-start-1 items-center">
  
        <Image
          src="/images/logo.png"
          alt="GGPS"
          width={400}
          height={200}
          className="mx-auto animate__animated animate__backInDown"
          // style={{
          //   background: 'radial-gradient(circle, rgba(128, 30, 30, 0.8) 0%, rgba(0, 0, 0, 0) 50%)'
          
          // }}
        />
        <div className={styles.subLogo1}>GAMER'S GLOBAL</div>
          <div className={styles.subLogo2}>POSITIONNING SYSTEM </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className={styles.button}
            href="/map"
          >

            Access map 
          </a>
          {/* <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a> */}
        </div>
      </main>
      {/* <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer> */}
    </div>
  );
}
