import { Map as MapLibreMap, Marker, NavigationControl, Popup, type MapRef } from '@vis.gl/react-maplibre';
import { useEffect, useState } from 'react';
import { DataProvider, DataProviderEvent, DataProviderEventType } from '../dataProviders/DataProvider';
import type { MapBaseLayer } from '../enitities/MapBaseLayer';




export function DisplayMapComponent() {
    const [mapCenter, setMapCenter] = useState<[number, number]>(localStorage.getItem('mapCenter')
        ? JSON.parse(localStorage.getItem('mapCenter') || '[7.1545,50.7438]') as [number, number]
        : [7.1545, 50.7438]);
    const [zoom, setZoom] = useState<number>(localStorage.getItem('mapZoom') ? parseFloat(localStorage.getItem('mapZoom') || '10') : 10);
    const [mapStyle, setMapStyle] = useState<MapBaseLayer | undefined>(undefined);


    useEffect(() => {
        const provider = DataProvider.getInstance();

        const mapStyle = provider.getMapStyle()
        if (mapStyle != undefined) {
            setMapStyle(mapStyle);
        }
        const onMapStyleUpdated = (event: DataProviderEvent) => {
            setMapStyle(event.data as MapBaseLayer);
        };
        provider.on(DataProviderEventType.MAP_STYLE_UPDATED, onMapStyleUpdated);

        return () => {
            provider.off(DataProviderEventType.MAP_STYLE_UPDATED, onMapStyleUpdated);
        };
    }, []);

    if (!mapStyle) {
        return <div>Loading...</div>;
    }

    return (
        <div className="display-map-component">

            <MapLibreMap
                initialViewState={{
                    longitude: mapCenter[0],
                    latitude: mapCenter[1],
                    zoom: zoom
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle.getUrl()}
                attributionControl={false}
            >

            </MapLibreMap>
        </div>
    );
}