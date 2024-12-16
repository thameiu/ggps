
import { useMap } from 'react-leaflet';
import { useEffect

 } from 'react';
function ModifyZoomButtons() {
    const map = useMap();

    useEffect(() => {
        
        const zoomControl = document.querySelector(".leaflet-control-zoom") as HTMLElement;
        const zoomInControl = document.querySelector(".leaflet-control-zoom-in") as HTMLElement;
        const zoomOutControl = document.querySelector(".leaflet-control-zoom-out") as HTMLElement;

        if (zoomControl) {
            zoomControl.style.top = "12vh"; 
            zoomControl.style.right = "10wh";
            zoomControl.style.backgroundColor = "#111";
            zoomInControl.style.backgroundColor = "#111";
            zoomInControl.style.color = "#fff";
            zoomOutControl.style.backgroundColor = "#111";
            zoomOutControl.style.color = "#fff"; 
        }
    }, [map]);

    return null;
}
export default ModifyZoomButtons;