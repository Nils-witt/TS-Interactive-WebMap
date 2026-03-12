import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';
import { type MapItem } from '../enitities/MapItem.ts';
import { DataBaseContext } from './DataBaseContext.tsx';

export const MapItemContext = createContext<MapItem[]>([]);

export function MapItemProvider({ children }: { children: ReactNode }) {

    const databaseProvider = useContext(DataBaseContext);
    const [mapItems, setMapItems] = useState<MapItem[]>(
        () => Array.from(DataProvider.getInstance().getAllMapItems().values())
    );

    useEffect(() => {
        const dp = DataProvider.getInstance();
        const refresh = () => setMapItems(Array.from(dp.getAllMapItems().values()));

        const events = [
            DataProviderEventType.MAP_ITEM_CREATED,
            DataProviderEventType.MAP_ITEM_UPDATED,
            DataProviderEventType.MAP_ITEM_DELETED,
        ] as const;
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));
        if (!databaseProvider) {
            console.error('MapItemProvider: DatabaseProvider not available in context');
            return;
        }
        void databaseProvider.loadAllMapItems().then((result) => {
            Object.values(result).forEach((item) => dp.addMapItem(item));
            refresh();
            return ApiProvider.getInstance()
                .loadAllMapItems()
                .then((remote) => {
                    Object.values(remote).forEach((item) => dp.addMapItem(item));
                    void databaseProvider.replaceAllMapItems(Object.values(remote));
                    refresh();
                })
                .catch((e) => console.error('MapItemContext: remote load failed', e));
        }).catch((e) => console.error('MapItemContext: DB load failed', e))


        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, [databaseProvider]);

    return (
        <MapItemContext.Provider value={mapItems}>{children}</MapItemContext.Provider>
    );
}

export function useMapItems(): MapItem[] {
    return useContext(MapItemContext);
}
