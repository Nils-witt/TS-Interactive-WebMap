import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';
import { type MapGroup } from '../enitities/MapGroup.ts';
import { DataBaseContext } from './DataBaseContext.tsx';

export const MapGroupContext = createContext<MapGroup[]>([]);

export function MapGroupProvider({ children }: { children: ReactNode }) {

    const databaseProvider = useContext(DataBaseContext);
    const [mapGroups, setMapGroups] = useState<MapGroup[]>(
        () => Array.from(DataProvider.getInstance().getAllMapGroups().values())
    );

    useEffect(() => {
        const dp = DataProvider.getInstance();
        const refresh = () => setMapGroups(Array.from(dp.getAllMapGroups().values()));

        const events = [
            DataProviderEventType.MAP_GROUPS_CREATED,
            DataProviderEventType.MAP_GROUPS_UPDATED,
            DataProviderEventType.MAP_GROUPS_DELETED,
        ] as const;
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));

        if (!databaseProvider) {
            console.error('MapGroupProvider: DatabaseProvider not available in context');
            return;
        }

        void databaseProvider.loadAllMapGroups().then((result) => {
            Object.values(result).forEach((g) => dp.addMapGroup(g));
            refresh();
            return ApiProvider.getInstance()
                .loadAllMapGroups()
                .then((remote) => {
                    Object.values(remote).forEach((g) => dp.addMapGroup(g));
                    void databaseProvider.replaceAllMapGroups(Object.values(remote));
                    refresh();
                })
                .catch((e) => console.error('MapGroupContext: remote load failed', e));
        }).catch((e) => console.error('MapGroupContext: DB load failed', e))


        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, [databaseProvider]);

    return (
        <MapGroupContext.Provider value={mapGroups}>{children}</MapGroupContext.Provider>
    );
}

export function useMapGroups(): MapGroup[] {
    return useContext(MapGroupContext);
}
