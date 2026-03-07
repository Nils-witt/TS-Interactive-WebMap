/*
 * MapComponent.tsx
 * ----------------
 * React component that renders the main interactive map using MapLibre.
 * Purpose: initialize map state, load remote styles/overlays/objects, persist view state
 * and wire app-level controls (search, layers, settings).
 * Exports: MapComponent(props: MapComponentProps)
 * Props:
 *  - keyValueStore: KeyValueInterface for persisting view state
 *  - dataProvider: DataProvider singleton instance for map data (overlays, styles)
 *  - eventHandler: GlobalEventHandler used by child controls to dispatch app events
 *  - showSettings?: optional flag to render a settings button
 * Side-effects: fetches map styles/overlays/objects from remote store and writes to local DB.
 */

import * as React from 'react';
import {useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import {GeolocateControl, Map as MapLibreMap, Marker, NavigationControl, Popup} from '@vis.gl/react-maplibre';
import ReactLayerControl from "../controls/LayerControl";
import ReactSearchControl from "../controls/SearchControl";
import {DataProvider, DataProviderEvent, DataProviderEventType} from "../dataProviders/DataProvider";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import type {MapBaseLayer} from "../enitities/MapBaseLayer.ts";
import type {KeyValueInterface} from "../dataProviders/KeyValueInterface.ts";
import {RouteDisplay} from "../controls/RouteDisplay.tsx";
import {UnitDisplay} from "../controls/UnitDisplay.tsx";
import {GroupDisplay} from "../controls/GroupDisplay.tsx";

interface MapComponentProps {
    keyValueStore: KeyValueInterface;
    dataProvider: DataProvider;
    eventHandler: GlobalEventHandler;
    showSettings?: boolean;
}

export function MapComponent(props: MapComponentProps) {


    const {keyValueStore, dataProvider, eventHandler} = props;

    const [searchParams] = useSearchParams();

    const qId      = searchParams.get('mapItemId');
    const qGroupId = searchParams.get('groupId');
    const qLat  = searchParams.get('lat');
    const qLng  = searchParams.get('lng');
    const qZoom = searchParams.get('zoom');

    // Resolve coordinates: id param → lat/lng params → localStorage → default (Bonn)
    const resolvedItem = qId ? dataProvider.getMapLocations().get(qId) : undefined;

    const mapCenter: [number, number] = resolvedItem
        ? [resolvedItem.getLongitude(), resolvedItem.getLatitude()]
        : (qLng && qLat)
            ? [parseFloat(qLng), parseFloat(qLat)]
            : localStorage.getItem('mapCenter')
                ? JSON.parse(localStorage.getItem('mapCenter') || '[7.1545,50.7438]') as [number, number]
                : [7.1545, 50.7438];

    const mapMoved = (e: { viewState: { longitude: number, latitude: number, zoom: number } }) => {
        void keyValueStore.setItem('mapCenter', JSON.stringify([e.viewState.longitude, e.viewState.latitude]));
        void keyValueStore.setItem('mapZoom', JSON.stringify(e.viewState.zoom));
    }

    const [mapStyle, setMapStyle] = React.useState<MapBaseLayer | null>(null);

    const [showItemPopup, setShowItemPopup] = React.useState<boolean>(true);

    const [zoom, setZoom] = React.useState<number>(() => {
        if (resolvedItem) return resolvedItem.getZoomLevel();
        if (qZoom) return parseFloat(qZoom);
        const stored = localStorage.getItem('mapZoom');
        return stored ? (JSON.parse(stored) as number) : 14;
    });


    useEffect(() => {

        if (!resolvedItem && !qZoom) {
            void keyValueStore.getItem('mapZoom').then((zoomValue) => {
                if (zoomValue) {
                    const parsedZoom = JSON.parse(zoomValue) as number;
                    setZoom(parsedZoom);
                }
            });
        }
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
        <MapLibreMap
            initialViewState={{
                longitude: mapCenter[0],
                latitude: mapCenter[1],
                zoom: zoom
            }}
            style={{width: '100%', height: '100%'}}
            mapStyle={mapStyle.getUrl()}
            attributionControl={false}
            onMoveEnd={mapMoved}
            onContextMenu={(e) => {
                e.originalEvent.preventDefault();
            }}
        >
            <GeolocateControl/>
            <NavigationControl/>
            <ReactLayerControl position="bottom-left" dataProvider={dataProvider}/>
            <ReactSearchControl position="top-left" dataProvider={dataProvider} globalEventHandler={eventHandler}/>

            <RouteDisplay></RouteDisplay>
            <UnitDisplay/>
            <GroupDisplay groupId={qGroupId}/>

            {resolvedItem && (
                <Marker longitude={resolvedItem.getLongitude()} latitude={resolvedItem.getLatitude()}/>
            )}
            {resolvedItem && showItemPopup && (
                <Popup
                    longitude={resolvedItem.getLongitude()}
                    latitude={resolvedItem.getLatitude()}
                    anchor="bottom"
                    offset={[0, -35] as [number, number]}
                    onClose={() => setShowItemPopup(false)}
                >
                    {resolvedItem.getName()}
                </Popup>
            )}
        </MapLibreMap>
    )
}