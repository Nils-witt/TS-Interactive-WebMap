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
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import {MapSettings} from "./SettingsComponent";
import ReactButtonControl from "../controls/ButtonControl";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import type {MapBaseLayer} from "../enitities/MapBaseLayer.ts";
import type {KeyValueInterface} from "../dataProviders/KeyValueInterface.ts";
import MapContextMenu from "./MapContextMenu.tsx";
import {MarkerEditor} from "./MarkerEditor.tsx";
import {RouteDisplay} from "../controls/RouteDisplay.tsx";
import {UnitDisplay} from "../controls/UnitDisplay.tsx";
import {WebSocketProvider} from "../dataProviders/WebSocketProvider.ts";

interface MapComponentProps {
    keyValueStore: KeyValueInterface;
    dataProvider: DataProvider;
    eventHandler: GlobalEventHandler;
    showSettings?: boolean;
}

export function MapComponent(props: MapComponentProps) {


    const {keyValueStore, dataProvider, eventHandler} = props;

    const [searchParams] = useSearchParams();

    const qId   = searchParams.get('mapItemId');
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
    const [settingsOpen, setSettingsOpen] = React.useState<boolean>(false);

    const [enableContextMenu, setEnableContextMenu] = React.useState<boolean>(true);
    const [isContextMenu, setContextMenu] = React.useState(false);
    const [points, setPoints] = React.useState({
        x: 0,
        y: 0,
        latitude: 0,
        longitude: 0
    });
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
        provider.on(DataProviderEventType.MAP_STYLE_UPDATED, (event) => {
            setMapStyle(event.data as MapBaseLayer);
        });
        const webSocketProvider = new WebSocketProvider();
        webSocketProvider.start();

        try {
            if ((navigator as Navigator).userAgentData.mobile) {
                setEnableContextMenu(false);
            }
        } catch (e) {
            console.log(e);
        }
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
                setPoints({
                    x: e.originalEvent.clientX,
                    y: e.originalEvent.clientY,
                    latitude: e.lngLat.lat,
                    longitude: e.lngLat.lng
                });
                setZoom(Math.round(e.target.getZoom()));
                setContextMenu(true);
                e.originalEvent.preventDefault();
            }}
            onClick={() => {
                setContextMenu(false);
            }}
        >
            <GeolocateControl/>
            <NavigationControl/>
            <ReactLayerControl position="bottom-left" dataProvider={dataProvider}/>
            <ReactSearchControl position="top-left" dataProvider={dataProvider} globalEventHandler={eventHandler}/>

            <MarkerEditor/>
            <RouteDisplay></RouteDisplay>
            <UnitDisplay/>

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

            {props.showSettings &&
                <ReactButtonControl onClick={() => setSettingsOpen(true)} position={"bottom-left"}
                                    icon={faGear}></ReactButtonControl>}
            {settingsOpen && <MapSettings isOpen={[settingsOpen, setSettingsOpen]}/>}

            {enableContextMenu && (
                <MapContextMenu top={points.y} left={points.x} latitude={points.latitude} longitude={points.longitude}
                                isVisible={[isContextMenu, setContextMenu]} zoom={zoom}>
                </MapContextMenu>)}
        </MapLibreMap>
    )
}