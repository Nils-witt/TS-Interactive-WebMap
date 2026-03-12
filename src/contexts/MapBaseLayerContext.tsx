import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { type MapBaseLayer } from '../enitities/MapBaseLayer.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';
import { DataBaseContext } from './DataBaseContext.tsx';

export const MapBaseLayerContext = createContext<MapBaseLayer | undefined>(DataProvider.getInstance().getMapStyle());

export function MapBaseLayerProvider({ children }: { children: ReactNode }) {

    const databaseProvider = useContext(DataBaseContext);
    const [mapBaseLayer, setMapBaseLayer] = useState<MapBaseLayer | undefined>(
        () => DataProvider.getInstance().getMapStyle()
    );

    useEffect(() => {
        const dp = DataProvider.getInstance();
        const refresh = () => setMapBaseLayer(dp.getMapStyle());

        const onUpdated = () => setMapBaseLayer(DataProvider.getInstance().getMapStyle());
        GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_STYLE_UPDATED, onUpdated);

        if (!databaseProvider) {
            console.error('MapBaseLayerProvider: DatabaseProvider not available in context');
            return;
        }
        void databaseProvider.loadAllMapStyles().then((result) => {
            Object.values(result).forEach((o) => dp.setMapStyle(o));
            refresh();
            return ApiProvider.getInstance()
                .loadAllMapStyles()
                .then((remote) => {
                    Object.values(remote).forEach((o) => dp.setMapStyle(o));
                    void databaseProvider.replaceAllMapStyles(Object.values(remote));
                    refresh();
                })
                .catch((e) => console.error('MapBaseLayerContext: remote load failed', e));
        }).catch((e) => console.error('MapBaseLayerContext: DB load failed', e))


        return () => GlobalEventHandler.getInstance().off(DataProviderEventType.MAP_STYLE_UPDATED, onUpdated);
    }, [databaseProvider]);

    return (
        <MapBaseLayerContext.Provider value={mapBaseLayer}>{children}</MapBaseLayerContext.Provider>
    );
}

export function useMapBaseLayer(): MapBaseLayer | undefined {
    return useContext(MapBaseLayerContext);
}
