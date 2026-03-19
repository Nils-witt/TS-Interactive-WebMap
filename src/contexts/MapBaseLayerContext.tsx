import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  DataProvider,
  DataProviderEventType,
} from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { type MapBaseLayer } from '../enitities/MapBaseLayer.ts';
import { DataBaseContext } from './DataBaseContext.tsx';
import { useApi } from './ApiContext.tsx';

export const MapBaseLayerContext = createContext<MapBaseLayer | undefined>(
  DataProvider.getInstance().getMapStyle(),
);

export function MapBaseLayerProvider({ children }: { children: ReactNode }) {
  const channel = new BroadcastChannel('addVectorCacheUrl');
  const dp = DataProvider.getInstance();

  const databaseProvider = useContext(DataBaseContext);
  const apiProvider = useApi();

  const [mapBaseLayer, setMapBaseLayer] = useState<MapBaseLayer | undefined>(
    () => DataProvider.getInstance().getMapStyle(),
  );

  const refresh = () => setMapBaseLayer(dp.getMapStyle());
  const onUpdated = () =>
    setMapBaseLayer(DataProvider.getInstance().getMapStyle());

  useEffect(() => {
    GlobalEventHandler.getInstance().on(
      DataProviderEventType.MAP_STYLE_UPDATED,
      onUpdated,
    );

    if (!databaseProvider) {
      console.error(
        'MapBaseLayerProvider: DatabaseProvider not available in context',
      );
      return;
    }
    void databaseProvider
      .loadAllMapStyles()
      .then((result) => {
        Object.values(result).forEach((layer) => {
          channel.postMessage({
            id: layer.getId(),
            url: layer.getCacheUrl(),
          });
          dp.setMapStyle(layer);
        });
        refresh();
        if (apiProvider.hasToken()) {
          apiProvider
            .loadAllMapStyles()
            .then((remote) => {
              Object.values(remote).forEach((layer) => {
                channel.postMessage({
                  id: layer.getId(),
                  url: layer.getCacheUrl(),
                });
                dp.setMapStyle(layer);
              });
              void databaseProvider.replaceAllMapStyles(Object.values(remote));
              refresh();
            })
            .catch((e) =>
              console.error('MapBaseLayerContext: remote load failed', e),
            );
        } else {
          console.log('User not authenticated, skipping remote map style load');
        }
      })
      .catch((e) => console.error('MapBaseLayerContext: DB load failed', e));

    return () =>
      GlobalEventHandler.getInstance().off(
        DataProviderEventType.MAP_STYLE_UPDATED,
        onUpdated,
      );
  }, [databaseProvider, apiProvider]);

  return (
    <MapBaseLayerContext.Provider value={mapBaseLayer}>
      {children}
    </MapBaseLayerContext.Provider>
  );
}

export function useMapBaseLayer(): MapBaseLayer | undefined {
  return useContext(MapBaseLayerContext);
}
