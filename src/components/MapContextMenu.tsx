import React, {useEffect} from "react";
import '../css/mapContextMenu.scss'
import {CreateMarkerForm} from "./CreateMarkerForm.tsx";

interface MapContextMenuProps {
    isVisible: [boolean, React.Dispatch<React.SetStateAction<boolean>>],
    top: number,
    left: number,
    latitude: number,
    longitude: number,
    zoom: number,
}

export default function MapContextMenu(props: MapContextMenuProps): React.JSX.Element {

    const [showMarkerCreate, setShowMarkerCreate] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.createMarkerContainer')) {
                setShowMarkerCreate(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!props.isVisible[1]) {
            setShowMarkerCreate(false);
        }
        setIsVisible(props.isVisible[0]);
    }, [props.isVisible[0]]);
    return (
        <div>
            {isVisible && (
                <div className={'mapcontextmenu-root'}
                     style={{top: props.top + 'px', left: props.left + 'px'}}>
                    <button onClick={() => {
                        setShowMarkerCreate(true);
                        setIsVisible(false);
                    }}>Create Marker
                    </button>
                </div>
            )}

            {showMarkerCreate && (
                <div className={'createMarkerContainer'}>
                    <CreateMarkerForm
                        isOpen={[showMarkerCreate, setShowMarkerCreate]}
                        data={{
                            longitude: props.longitude,
                            latitude: props.latitude,
                            zoom: props.zoom
                        }}
                    />
                </div>
            )}
        </div>
    );
}