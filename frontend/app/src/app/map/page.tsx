// pages/index.tsx
import dynamic from 'next/dynamic';

// Dynamically import the Map component with "ssr: false" since Leaflet relies on the browser
const Map = dynamic(() => import('../../../components/map/map'), { ssr: false });

export default function Home() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Map />
    </div>
  );
}
