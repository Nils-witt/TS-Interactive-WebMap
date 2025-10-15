import * as React from 'react';
import {Map as MapLibreMap} from '@vis.gl/react-maplibre';
import {GeolocateControl, NavigationControl} from '@vis.gl/react-maplibre';
import {LayerInfo} from "../types/LayerInfo";
import {useEffect} from "react";
import {ApiProvider} from "../dataProviders/ApiProvider";
import ReactLayerControl from "../controls/LayerControl";
import ReactSearchControl from "../controls/SearchControl";
import {DataProvider} from "../dataProviders/DataProvider";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import ReactSettingsControl from "../controls/SettingsControl.ts";


export function MapComponent() {

    const dataProvider = DataProvider.getInstance();
    const eventHandler = GlobalEventHandler.getInstance();
    const mapCenter: [number, number] = localStorage.getItem('mapCenter') ? JSON.parse(localStorage.getItem('mapCenter') || "[7.1545,50.7438]") : [7.1545, 50.7438];

    const mapMoved = (e: { viewState: { longitude: number, latitude: number, zoom: number } }) => {
        localStorage.setItem('mapCenter', JSON.stringify([e.viewState.longitude, e.viewState.latitude]));
        localStorage.setItem('mapZoom', JSON.stringify(e.viewState.zoom));
    }

    const [layers, setLayers] = React.useState<LayerInfo[]>([]);
    const [mapStyle, setMapStyle] = React.useState<LayerInfo | null>(null);

    useEffect(() => {
        ApiProvider.getInstance().getMapStyles().then(result => {
            if (result.length > 0) {
                setMapStyle(result[0]);
                ApiProvider.getInstance().getOverlayLayers().then(result => {
                    setLayers(result);
                });
            }
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
            <ReactLayerControl position="bottom-left" layers={layers} shownLayers={[]} dataProvider={dataProvider}/>
            <ReactSearchControl position="top-left" dataProvider={dataProvider} globalEventHandler={eventHandler}/>
            <ReactSettingsControl position={"bottom-left"}></ReactSettingsControl>
        </MapLibreMap>
    )
}