import * as React from 'react';
import {Map as MapLibreMap} from 'react-map-gl/maplibre';
import {Source, Layer, GeolocateControl, NavigationControl,ScaleControl} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const accesstoken = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYxMzg0NzA4LCJpYXQiOjE3NjAzNDc5MDgsImp0aSI6ImJiZjkxZmMyYWVhYzQ2MWVhM2Q2ZWYxYzA3OTgxNmY4IiwidXNlcl9pZCI6Miwib3ZlcmxheXMiOlsiMjAyNF9wdWVtYSIsIjIwMjVfcHVlbWEiLCIyMDI1X21hcmF0aG9uX2lubmVuc3RhZHQiLCIyMDI1X21hcmF0aG9uX3N0cmVja2UiLCIyMDI1X3B1ZW1hX2x1ZnQiXSwiaXNfc3VwZXJ1c2VyIjp0cnVlLCJ2aWV3X2FsbCI6dHJ1ZX0.1fbA0rn6mOMTEfjxqrJp4fz1vaduktdYqzxumuU1BkZUzD-3irJ2yVLSAfrAse9I6_kLPXJbyCndX_cpC3Octw"

export function MapComponent()   {

    let overlays: string[] = [
        "https://map.home.nils-witt.de/overlays/2025_puema/{z}/{x}/{y}.png"
    ];

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
            <GeolocateControl />
            <NavigationControl />
            {overlays.map((overlay,idx) =>
                <Source key={'overlay-source-' + idx} id={'overlay-source-' + idx} type="raster" tileSize={256} tiles={[overlay+'?accesstoken='+accesstoken]}>
                    <Layer key={'overlay-layer-' + idx} id={'overlay-layer-' + idx} type={'raster'}></Layer>
                </Source>
            )}

        </MapLibreMap>
    )
}