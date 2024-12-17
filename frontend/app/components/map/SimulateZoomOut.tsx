import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

function SimulateZoomOut() {
    const map = useMap();

    useEffect(() => {
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom - 1, { animate: true });
    }, [map]);

    return null;
}
export default SimulateZoomOut;
