import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';
import { type MapOverlay } from '../enitities/MapOverlay.ts';
import { DataBaseContext } from './DataBaseContext.tsx';

export const MapOverlayContext = createContext<MapOverlay[]>([]);

export function MapOverlayProvider({ children }: { children: ReactNode }) {

    const databaseProvider = useContext(DataBaseContext);
    const [mapOverlays, setMapOverlays] = useState<MapOverlay[]>(
        () => Array.from(DataProvider.getInstance().getAllMapOverlays().values())
    );

    useEffect(() => {
        const dp = DataProvider.getInstance();
        const refresh = () => setMapOverlays(Array.from(dp.getAllMapOverlays().values()));

        const events = [
            DataProviderEventType.OVERLAY_ADDED,
            DataProviderEventType.OVERLAY_UPDATED,
            DataProviderEventType.OVERLAY_DELETED,
        ] as const;
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));
        if (!databaseProvider) {
            console.error('MapOverlayProvider: DatabaseProvider not available in context');
            return;
        }
        void databaseProvider.loadAllMapOverlays().then((result) => {
            Object.values(result).forEach((o) => dp.addMapOverlay(o));
            refresh();
            return ApiProvider.getInstance()
                .loadAllMapOverlays()
                .then((remote) => {
                    Object.values(remote).forEach((o) => dp.addMapOverlay(o));
                    void databaseProvider.replaceAllMapOverlays(Object.values(remote));
                    refresh();
                })
                .catch((e) => console.error('MapOverlayContext: remote load failed', e));
        }).catch((e) => console.error('MapOverlayContext: DB load failed', e))


        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, [databaseProvider]);

    return (
        <MapOverlayContext.Provider value={mapOverlays}>{children}</MapOverlayContext.Provider>
    );
}

export function useMapOverlays(): MapOverlay[] {
    return useContext(MapOverlayContext);
}
