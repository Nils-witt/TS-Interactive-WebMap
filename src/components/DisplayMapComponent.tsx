import { Map as MapLibreMap, type ViewStateChangeEvent } from '@vis.gl/react-maplibre';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { UnitDisplay } from '../controls/UnitDisplay';
import { MapOverlayContext } from '../contexts/MapOverlayContext.tsx';


import './css/displayMapComponent.scss';
import { useMapBaseLayer } from '../contexts/MapBaseLayerContext.tsx';
import { WebsocketStatusDisplay } from './WebsocketStatusDisplay.tsx';

export interface DisplayMapComponentProps {
    visibleOverlayIds: string[];
    visibleUnitIds: string[];
    showUnitsStatusBar?: boolean;
}


export function DisplayMapComponent({ visibleOverlayIds, visibleUnitIds, showUnitsStatusBar }: DisplayMapComponentProps) {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [mapCenter, setMapCenter] = useState<[number, number]>(localStorage.getItem('mapCenterDisplay')
        ? JSON.parse(localStorage.getItem('mapCenterDisplay') || '[7.1545,50.7438]') as [number, number]
        : [7.1545, 50.7438]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [zoom, setZoom] = useState<number>(localStorage.getItem('mapZoomDisplay') ? parseFloat(localStorage.getItem('mapZoomDisplay') || '10') : 10);

    const baseLayer = useMapBaseLayer();
    const overlays = useContext(MapOverlayContext);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const visibleOverlays = useMemo(() => new Set(visibleOverlayIds), [visibleOverlayIds]);
    const visibleUnits = useMemo(() => new Set(visibleUnitIds), [visibleUnitIds]);


    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoaded) {
            return;
        }

        const sortedOverlays = [...overlays].sort((a, b) => {
            if (a.getOrder() !== b.getOrder()) {
                return a.getOrder() - b.getOrder();
            }
            return a.getName().localeCompare(b.getName());
        });

        const activeSourceIds = new Set(sortedOverlays.map((overlay) => `display-overlay-source-${overlay.getId()}`));
        const activeLayerIds = new Set(sortedOverlays.map((overlay) => `display-overlay-layer-${overlay.getId()}`));

        const style = map.getStyle();
        if (!style) {
            return;
        }

        const existingDisplayLayers = style.layers
            .map((layer) => layer.id)
            .filter((id) => id.startsWith('display-overlay-layer-'));

        for (const layerId of existingDisplayLayers) {
            if (!activeLayerIds.has(layerId) && map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
        }

        const existingSourceIds = Object.keys(style.sources)
            .filter((id) => id.startsWith('display-overlay-source-'));

        for (const sourceId of existingSourceIds) {
            if (!activeSourceIds.has(sourceId) && map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
        }

        for (const overlay of sortedOverlays) {
            const sourceId = `display-overlay-source-${overlay.getId()}`;
            const layerId = `display-overlay-layer-${overlay.getId()}`;

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, {
                    type: 'raster',
                    tiles: [`${overlay.getUrl()}?accesstoken=`],
                    tileSize: 256,
                });
            }

            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }

            map.addLayer({
                id: layerId,
                type: 'raster',
                source: sourceId,
                paint: {
                    'raster-opacity': overlay.getOpacity(),
                },
            });

            map.setLayoutProperty(layerId, 'visibility', visibleOverlays.has(overlay.getId()) ? 'visible' : 'none');
        }
    }, [mapLoaded, overlays, visibleOverlays]);


    const updateView = (e: ViewStateChangeEvent) => {
        localStorage.setItem('mapCenterDisplay', JSON.stringify([e.viewState.longitude, e.viewState.latitude]));
        localStorage.setItem('mapZoomDisplay', e.viewState.zoom.toString());
    };
    if (!baseLayer) {
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
                mapStyle={baseLayer.getUrl()}
                attributionControl={false}
                onMoveEnd={(e) => updateView(e)}
                ref={(instance) => {
                    mapRef.current = instance ? instance.getMap() : null;
                }}
                onLoad={() => setMapLoaded(true)}
            >
                <UnitDisplay showOnly={Array.from(visibleUnits)} showAlways={true} iconSize={75} showStatusBar={showUnitsStatusBar || false} />
            </MapLibreMap>
            <WebsocketStatusDisplay />
        </div>
    );
}