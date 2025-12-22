import React, {useEffect} from "react";
import '../css/mapContextMenu.scss'
import {DataEvent, GlobalEventHandler} from "../dataProviders/GlobalEventHandler.ts";

interface MapContextMenuProps {
    isVisible: [boolean, React.Dispatch<React.SetStateAction<boolean>>],
    top: number,
    left: number,
    latitude: number,
    longitude: number,
    zoom: number,
}

export default function MapContextMenu(props: MapContextMenuProps): React.JSX.Element {
    const [isVisible, setIsVisible] = React.useState(false);

    useEffect(() => {
        setIsVisible(props.isVisible[0]);
    }, [props.isVisible[0]]);
    return (
        <div>
            {isVisible && (
                <div className={'mapcontextmenu-root'}
                     style={{top: props.top + 'px', left: props.left + 'px'}}>
                    <button onClick={() => {
                        GlobalEventHandler.getInstance().emit('create-marker', new DataEvent('create-marker', {latitude: props.latitude, longitude: props.longitude, zoom: props.zoom}));
                        setIsVisible(false);
                    }}>Create Marker
                    </button>
                </div>
            )}
        </div>
    );
}