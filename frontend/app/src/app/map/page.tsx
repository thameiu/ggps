"use client"
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('../../../components/map/map'), { ssr: false });

export default function Home() {
  localStorage.removeItem("fetchedEvents");
  localStorage.removeItem("filteredEvents");
  console.log("mapinit");
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Map />
    </div>
  );
}
