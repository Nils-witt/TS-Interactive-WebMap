import {CreateMarkerForm} from "./CreateMarkerForm.tsx";
import {DataEvent, GlobalEventHandler} from "../dataProviders/GlobalEventHandler.ts";
import {useEffect, useState} from "react";
import type {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject.ts";

import './css/markereditor.scss'

export function MarkerEditor() {

    const [isShown, setIsShown] = useState<boolean>(false);
    const [entity, setEntity] = useState<NamedGeoReferencedObject | undefined>(undefined);
    const [prepopulateData, setPrepopulateData] = useState<{ latitude: number; longitude: number; zoom: number } | undefined>(undefined);

    useEffect(() => {
        GlobalEventHandler.getInstance().on('edit-marker', (data) => {
            const eventData = data as DataEvent;
            setEntity(eventData.data as NamedGeoReferencedObject);
            setIsShown(true);
        });

        GlobalEventHandler.getInstance().on('create-marker', (data) => {
            const eventData = data as DataEvent;
            const dataset = eventData.data as { latitude: number; longitude: number; zoom: number };
            setEntity(undefined);
            setPrepopulateData(dataset);
            setIsShown(true);
        });

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.marker-editor-root')) {
                setIsShown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
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