import { useMapEvents } from 'react-leaflet';

function BoundsFinder({ setBounds }: { setBounds: Function }) {
    const map = useMapEvents({
        moveend() {
            setBounds(map.getBounds());
        },
    });
    return null;
}
export default BoundsFinder;
