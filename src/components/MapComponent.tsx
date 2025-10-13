import * as React from 'react';
import {Map as MapLibreMap} from 'react-map-gl/maplibre';
import {GeolocateControl, NavigationControl, useControl} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {LayersControl} from "../controls/LayerControl";
import {LayerInfo} from "../types/LayerInfo";
import {useEffect} from "react";
import {ApiProvider} from "../dataProviders/ApiProvider";
import {SearchControl} from "../controls/SearchControl";

function ReactLayerControl(props: any) {
    const layercontrol = useControl(() => new LayersControl(props), {
        position: props.position
    });
    layercontrol.setOverlays(props.layers);
    console.log("Updating ReactLayerControl",props.layers);

    return null;
}

function ReactSearchControl(props: any) {
    useControl(() => new SearchControl(), {
        position: props.position
    });

    return null;
}


export function MapComponent() {

    const [layers, setLayers] = React.useState<LayerInfo[]>([]);

    useEffect(() => {
        ApiProvider.getInstance().getOverlayLayers().then(result => {
            setLayers(result);
        });
    }, []);


    return (
        <MapLibreMap
            initialViewState={{
                longitude: 7.1545,
                latitude: 50.7438,
                zoom: 14
            }}
            style={{width: '100vw', height: '100vh'}}
            mapStyle="https://map.home.nils-witt.de/vector/styles/osm-liberty/style.json"
            attributionControl={false}
        >
            <GeolocateControl/>
            <NavigationControl/>
            <ReactLayerControl position="bottom-left" layers={layers}/>
            <ReactSearchControl position="top-left"/>

        </MapLibreMap>
    )
}