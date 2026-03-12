import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { MapConfig } from '../enitities/MapConfig.ts';

export const MapConfigContext = createContext<MapConfig>(DataProvider.getInstance().getMapConfig());

export function MapConfigProvider({ children }: { children: ReactNode }) {

    const [mapConfig, setMapConfig] = useState<MapConfig>(
        () => DataProvider.getInstance().getMapConfig()
    );

    useEffect(() => {
        const onUpdated = () => setMapConfig(DataProvider.getInstance().getMapConfig());
        GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_CONFIG_UPDATED, onUpdated);
        return () => GlobalEventHandler.getInstance().off(DataProviderEventType.MAP_CONFIG_UPDATED, onUpdated);
    }, []);

    return (
        <MapConfigContext.Provider value={mapConfig}>{children}</MapConfigContext.Provider>
    );
}

export function useMapConfig(): MapConfig {
    return useContext(MapConfigContext);
}
