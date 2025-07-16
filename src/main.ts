/**
 * Main entry point for the MapLibre WebMap application.
 * This file initializes the map, loads available layers, and sets up the UI controls.
 */

import './style.css'
import 'maplibre-gl/dist/maplibre-gl.css';
import {GeolocateControl, Map as MapLibreMap, Marker, NavigationControl, Popup} from 'maplibre-gl';
import {LayersControl} from "./controls/LayerControl.ts";
import type {LayerInfo} from "./types/LayerInfo.ts";
import type {TraccarPosition} from "./types/TraccarPosition.ts";
import {SearchControl} from "./controls/SearchControl.ts";
import type {MapEntity} from "./types/MapEntity.ts";
import {ApiProvider} from "./dataProviders/ApiProvider.ts";

const debugMode = false; // Set to true for debugging purposes, will log additional information

let mapCenter: [number, number] = [0, 0]; // Default map center coordinates
let mapZoom: number = 2; // Default zoom level

if (localStorage.getItem('mapCenter')) {
    mapCenter = JSON.parse(localStorage.getItem('mapCenter') || '[0, 0]');
}

if (localStorage.getItem('mapZoom')) {
    mapZoom = parseFloat(localStorage.getItem('mapZoom') || '13');
}

/**
 * Initialize the MapLibre map with basic configuration
 */
const map = new MapLibreMap({
    container: 'map',                                           // HTML element ID where the map will be rendered
    //  style: defaultStyle, // Base map style URL
    center: mapCenter,                                      // Initial center of the map
    zoom: mapZoom,                                         // Initial zoom level
});

let devices = new Map<number, Marker>();

/**
 * Add geolocation control to allow users to find and track their location
 */
map.addControl(
    new GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true  // Use high accuracy for better location precision
        },
        trackUserLocation: true,       // Continuously update user's location
        showAccuracyCircle: true, // Show accuracy circle around user's location
        showUserLocation: true,  // Show user's location on the map
    }), 'top-right'
);
/**
 * Add navigation controls (zoom, rotation, etc.)
 */
let navControl = new NavigationControl({
    showCompass: true,      // Show compass for rotation
    visualizePitch: true,   // Show pitch control
    showZoom: true          // Show zoom controls
});
map.addControl(navControl, 'top-right');  // Position in the bottom-left corner


(async () => {
    try {
        let mapStyles = await ApiProvider.getInstance().getMapStyles();
        console.log("Available map styles:", mapStyles);
        map.setStyle(mapStyles[0].url); // Set the first style as the default style

    }catch (e) {
        console.error("Error loading map styles:", e);
    }
})();
/**
 * Set up map layers and controls once the map is loaded
 */
map.on('load', async () => {
    /**
     * Fetch available overlay layers from the server
     */
    map.on('moveend', () => {
        if (debugMode) {
            // Log the map center and zoom level after moving the map
            console.log("Map moved to:", map.getCenter().toArray(), "Zoom level:", map.getZoom());
        }
        localStorage.setItem('mapCenter', JSON.stringify(map.getCenter().toArray()));
        localStorage.setItem('mapZoom', map.getZoom().toString());
    });

    try {
        let entities: MapEntity[] = await ApiProvider.getInstance().getMapObjects();
        let searchControl = new SearchControl({entities: entities});
        map.addControl(searchControl, 'top-left');
    } catch (e) {
        console.error("Error loading searchControl:", e);
    }

    try {

        let preactiveOverlays: string[] = [];

        if (localStorage.getItem('activeOverlays')) {
            preactiveOverlays = JSON.parse(localStorage.getItem('activeOverlays') || '[]');
        }
        if (debugMode) {
            console.log("Preactive overlays:", preactiveOverlays);
        }
        let availableLayers: LayerInfo[] = await ApiProvider.getInstance().getOverlayLayers();
        /**
         * For each available layer:
         * 1. Add it as a source to the map
         * 2. Create a layer using that source
         * 3. Set the layer to be initially hidden
         */
        availableLayers.forEach((layer) => {
            // Add the layer source
            map.addSource(layer.id, {
                type: "raster",           // Use raster tiles
                tiles: [layer.url],       // URL template for the tiles
                tileSize: 256             // Standard tile size
            });

            // Create a map layer using the source
            map.addLayer({
                id: layer.id + '-layer',  // Create unique layer ID
                type: "raster",           // Render as raster layer
                source: layer.id,         // Reference to the source created above
            });

            // Initially hide the layer - will be toggled by the layer control
            if (!preactiveOverlays.includes(layer.id)) {
                map.setLayoutProperty(layer.id + '-layer', 'visibility', 'none');
            }
        });

        /**
         * Add layer control to allow users to toggle overlay layers
         */
        let lc = new LayersControl(availableLayers);
        map.addControl(lc, 'top-left');  // Position in the top-left corner of the map


        // Position in the top-right corner of the map
    } catch (e) {
        console.error("Error loading overlay layers:", e);
    }

});


(async () => {
    const ws = new WebSocket('wss://map.nils-witt.de/traccar/');
    if (debugMode) {
        ws.onopen = () => {
            // console.log('WebSocket connection established');
        };
    }
    ws.onmessage = (event) => {
        try {
            const message: { positions: TraccarPosition[] } = JSON.parse(event.data);
            if (message.positions) {
                console.log('Received positions:', message.positions);
                for (const position of message.positions) {
                    if (devices.has(position.deviceId)) {
                        // Update existing marker
                        const marker = devices.get(position.deviceId);
                        if (marker) {
                            marker.setLngLat([position.longitude, position.latitude]);
                        }
                    } else {
                        // Create a new marker for the device
                        const marker = new Marker()
                            .setLngLat([position.longitude, position.latitude])
                            .setPopup(new Popup().setText(`Device ID: ${position.deviceId}`))
                            .addTo(map);
                        devices.set(position.deviceId, marker);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    if (debugMode) {
        ws.onclose = () => {
            // console.log('WebSocket connection closed');
        };
    }
})();