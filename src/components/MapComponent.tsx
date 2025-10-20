import * as React from 'react';
import {Map as MapLibreMap} from '@vis.gl/react-maplibre';
import {GeolocateControl, NavigationControl} from '@vis.gl/react-maplibre';
import {useEffect} from "react";
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


export function MapComponent() {

    const dataProvider = DataProvider.getInstance();
    const eventHandler = GlobalEventHandler.getInstance();
    const mapCenter: [number, number] = localStorage.getItem('mapCenter') ? JSON.parse(localStorage.getItem('mapCenter') || "[7.1545,50.7438]") as [number, number] : [7.1545, 50.7438];

    const mapMoved = (e: { viewState: { longitude: number, latitude: number, zoom: number } }) => {
        localStorage.setItem('mapCenter', JSON.stringify([e.viewState.longitude, e.viewState.latitude]));
        localStorage.setItem('mapZoom', JSON.stringify(e.viewState.zoom));
    }

    const [mapStyle, setMapStyle] = React.useState<MapStyle | null>(null);
    const [settingsOpen, setSettingsOpen] = React.useState<boolean>(false);

    useEffect(() => {
        const mapStyle = DataProvider.getInstance().getMapStyle()
        if (mapStyle != undefined){
            setMapStyle(mapStyle);
        }
        DataProvider.getInstance().on(DataProviderEventType.MAP_STYLE_UPDATED, (event) => {
            setMapStyle(event.data as MapStyle);
        });

        void ApiProvider.getInstance().getMapStyles().then((result: MapStyle[]) => {
            if (result.length > 0) {
                DataProvider.getInstance().setMapStyle(result[0])
            }
        });
        void ApiProvider.getInstance().getOverlayLayers().then((result: Overlay[]) => {
            result.forEach(r => DataProvider.getInstance().addOverlay(r))
        });
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
        >
            <GeolocateControl/>
            <NavigationControl/>
            <ReactLayerControl position="bottom-left" dataProvider={dataProvider}/>
            <ReactSearchControl position="top-left" dataProvider={dataProvider} globalEventHandler={eventHandler}/>
            <ReactButtonControl onClick={() => setSettingsOpen(true)} position={"bottom-left"}
                                icon={faGear}></ReactButtonControl>
            {settingsOpen && <MapSettings isOpen={[settingsOpen, setSettingsOpen]}/>}
        </MapLibreMap>
    )
}