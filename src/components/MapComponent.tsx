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
import {GeolocateControl, Map as MapLibreMap, NavigationControl} from '@vis.gl/react-maplibre';
import {ApiProvider} from "../dataProviders/ApiProvider";
import ReactLayerControl from "../controls/LayerControl";
import ReactSearchControl from "../controls/SearchControl";
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import {MapSettings} from "./SettingsComponent";
import ReactButtonControl from "../controls/ButtonControl";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import type {MapStyle} from "../enitities/MapStyle.ts";
import type {Overlay} from "../enitities/Overlay.ts";
import type {StorageInterface} from "../dataProviders/StorageInterface.ts";
import {DatabaseProvider} from "../dataProviders/DatabaseProvider.ts";
import type {KeyValueInterface} from "../dataProviders/KeyValueInterface.ts";
import type {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject.ts";
import MapContextMenu from "./MapContextMenu.tsx";
import {MarkerEditor} from "./MarkerEditor.tsx";

interface MapComponentProps {
    keyValueStore: KeyValueInterface;
    dataProvider: DataProvider;
    eventHandler: GlobalEventHandler;
    showSettings?: boolean;
}

export function MapComponent(props: MapComponentProps) {
    const {keyValueStore, dataProvider, eventHandler} = props;

    // Use Coords from localStorage or default to Bonn, Germany if not found or invalid
    const mapCenter: [number, number] = localStorage.getItem('mapCenter') ? JSON.parse(localStorage.getItem('mapCenter') || "[7.1545,50.7438]") as [number, number] : [7.1545, 50.7438];

    const mapMoved = (e: { viewState: { longitude: number, latitude: number, zoom: number } }) => {
        void keyValueStore.setItem('mapCenter', JSON.stringify([e.viewState.longitude, e.viewState.latitude]));
        void keyValueStore.setItem('mapZoom', JSON.stringify(e.viewState.zoom));
    }

    const [mapStyle, setMapStyle] = React.useState<MapStyle | null>(null);
    const [settingsOpen, setSettingsOpen] = React.useState<boolean>(false);

    const [enableContextMenu, setEnableContextMenu] = React.useState<boolean>(true);
    const [isContextMenu, setContextMenu] = React.useState(false);
    const [points, setPoints] = React.useState({
        x: 0,
        y: 0,
        latitude: 0,
        longitude: 0
    });
    const [zoom, setZoom] = React.useState<number>(14);


    useEffect(() => {
        const mapStyle = DataProvider.getInstance().getMapStyle()
        if (mapStyle != undefined) {
            setMapStyle(mapStyle);
        }
        DataProvider.getInstance().on(DataProviderEventType.MAP_STYLE_UPDATED, (event) => {
            setMapStyle(event.data as MapStyle);
        });

        try {

            if ((navigator as Navigator).userAgentData.mobile) {
                setEnableContextMenu(false);
            }
        } catch (e) {
            console.error(e);
        }


        void DatabaseProvider.getInstance().then(localStorage => {
            const remoteStorage: StorageInterface = ApiProvider.getInstance();
            void remoteStorage.loadAllMapStyles().then((result: Record<string, MapStyle>) => {
                const mapStyles = Object.values(result);
                if (mapStyles.length > 0) {
                    DataProvider.getInstance().setMapStyle(Object.values(result)[0]);
                }
                void localStorage.replaceMapStyles(mapStyles);
            });

            void remoteStorage.loadAllOverlays().then((result: Record<string, Overlay>) => {
                const remoteOverlays = Object.values(result);
                remoteOverlays.forEach((overlay: Overlay) => {
                    DataProvider.getInstance().addOverlay(overlay);
                });
                void localStorage.replaceOverlays(remoteOverlays)
            });


            void remoteStorage.loadAllMapGroups().then((result) => {
                const remoteMapGroups = Object.values(result);
                remoteMapGroups.forEach((group) => {
                    DataProvider.getInstance().addMapGroup(group);
                });
                void localStorage.replaceMapGroups(remoteMapGroups);
            });
            void remoteStorage.loadAllNamedGeoReferencedObjects().then((result) => {
                const remoteObjects = Object.values(result);
                remoteObjects.forEach((item: NamedGeoReferencedObject) => {
                    DataProvider.getInstance().addMapItem(item);
                });
                void localStorage.replaceNamedGeoReferencedObjects(remoteObjects);
            });
        })


    }, []);

    if (!mapStyle) {
        return <div>Loading...</div>;
    }

    return (
        <MapLibreMap
            initialViewState={{
                longitude: mapCenter[0],
                latitude: mapCenter[1],
                zoom: 14
            }}
            style={{width: '100vw', height: '100vh'}}
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