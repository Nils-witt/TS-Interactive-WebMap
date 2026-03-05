import {CreateMarkerForm} from "./CreateMarkerForm.tsx";
import {DataEvent, GlobalEventHandler} from "../dataProviders/GlobalEventHandler.ts";
import {useEffect, useState} from "react";
import type {MapItem} from "../enitities/MapItem.ts";

import './css/markereditor.scss'

export function MarkerEditor() {

    const [isShown, setIsShown] = useState<boolean>(false);
    const [entity, setEntity] = useState<MapItem | undefined>(undefined);
    const [prepopulateData, setPrepopulateData] = useState<{ latitude: number; longitude: number; zoom: number } | undefined>(undefined);

    useEffect(() => {
        const onEditMarker = (data: Event) => {
            const eventData = data as DataEvent;
            setEntity(eventData.data as MapItem);
            setIsShown(true);
        };

        const onCreateMarker = (data: Event) => {
            const eventData = data as DataEvent;
            const dataset = eventData.data as { latitude: number; longitude: number; zoom: number };
            setEntity(undefined);
            setPrepopulateData(dataset);
            setIsShown(true);
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.marker-editor-root')) {
                setIsShown(false);
            }
        };

        GlobalEventHandler.getInstance().on('edit-marker', onEditMarker);
        GlobalEventHandler.getInstance().on('create-marker', onCreateMarker);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            GlobalEventHandler.getInstance().off('edit-marker', onEditMarker);
            GlobalEventHandler.getInstance().off('create-marker', onCreateMarker);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={'marker-editor-root'}>
            {isShown && (
                <div>
                    <CreateMarkerForm entity={entity} data={prepopulateData}/>
                </div>
            )}
        </div>
    );
}