import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

function SimulateZoomOut() {
    const map = useMap();

    useEffect(() => {
        const timer = setTimeout(() => {
            map.setZoom(map.getZoom() - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [map]);

    return null;
}
export default SimulateZoomOut;
