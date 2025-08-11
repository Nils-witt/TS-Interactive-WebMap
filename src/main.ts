/**
 * Main entry point for the MapLibre WebMap application.
 * This file initializes the map, loads available layers, and sets up the UI controls.
 */
/// <reference lib="dom" />
import 'maplibre-gl/dist/maplibre-gl.css';
import {GeolocateControl, Map as MapLibreMap, NavigationControl} from 'maplibre-gl';
import type {LayerInfo} from "./types/LayerInfo.ts";
import {ApiProvider, ApiProviderEventTypes} from "./dataProviders/ApiProvider.ts";
import {DrawingController} from "./controls/DrawingController.ts";
import {Config} from "./Config.ts";
import {DataProvider, DataProviderEventType} from "./dataProviders/DataProvider.ts";
import {EditorController} from "./EditorController.ts";
import {SearchControl} from "./controls/SearchControl.ts";
import {MapEditContextMenu} from "./controls/MapEditContextMenu.ts";
import './style.css'
import {LoginController} from "./controls/LoginController.ts";
import {LayersControl} from "./controls/LayerControl.ts";


if (window.location.pathname === '/') {
    window.location.pathname = '/index.html';
}
/*
const intervalMS = 60 * 60 * 1000

registerSW({
    onRegisteredSW(swUrl, r) {
        r && setInterval(async () => {
            if (r.installing || !navigator)
                return

            if (('connection' in navigator) && !navigator.onLine)
                return

            const resp = await fetch(swUrl, {
                cache: 'no-store',
                headers: {
                    'cache': 'no-store',
                    'cache-control': 'no-cache',
                },
            })

            if (resp?.status === 200)
                await r.update()
        }, intervalMS)
    }
})
*/
const debugMode = false; // Set to true for debugging purposes, will log additional information

const config = Config.getInstance()
const dataProvider = DataProvider.getInstance();
ApiProvider.getInstance();

const mapContainer = document.createElement('div');
const editorLayout = document.createElement('div');
const editorControls = document.createElement('div');

mapContainer.id = 'map';
mapContainer.innerText = 'Error loading the map';
mapContainer.classList.add('w-full'); // Add a class for styling
mapContainer.classList.add('h-full'); // Add a class for styling

if (config.editMode) {
    document.body.appendChild(editorLayout);
    editorLayout.appendChild(mapContainer);
    editorLayout.appendChild(editorControls);
    editorLayout.classList.add('w-full'); // Add a class for styling
    editorLayout.classList.add('h-full'); // Add a class for styling
    editorLayout.classList.add('flex'); // Use flexbox for layout
} else {
    document.body.appendChild(mapContainer);
}

const drawingController = new DrawingController();

LoginController.getInstance();
/**
 * Initialize the MapLibre map with basic configuration
 */
const map = new MapLibreMap({
    container: 'map',                                           // HTML element ID where the map will be rendered
    center: config.mapCenter,                                     // Initial center of the map
    zoom: config.mapZoom,                                         // Initial zoom level
    attributionControl: false,
    rollEnabled: true,
});

const geolocate = new GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true  // Use high accuracy for better location precision
    },
    trackUserLocation: true,       // Continuously update user's location
    showAccuracyCircle: true, // Show accuracy circle around user's location
    showUserLocation: true,  // Show user's location on the map
});
let navControl = new NavigationControl({
    showCompass: false,      // Show compass for rotation
    visualizePitch: false,   // Show pitch control
    showZoom: true          // Show zoom controls
});

const searchControl = new SearchControl();
const layersControl = new LayersControl();

map.addControl(navControl, 'top-right');  // Position in the bottom-left corner
map.addControl(layersControl, 'bottom-left');  // Position in the top-left corner of the

if (!config.editMode) {
    map.addControl(geolocate, 'top-right'); // Add geolocation control to the map
    map.addControl(searchControl, 'top-left');
}

drawingController.addTo(map); // Set the map for the drawing controller


if (config.editMode) {
    const editorController = new EditorController(editorControls, map);
    new MapEditContextMenu({
        map: map,
        editor: editorController
    });
}

dataProvider.on(DataProviderEventType.MAP_STYLE_UPDATED, (event) => {
    const style = event.data as LayerInfo;
    console.log("Setting map style to:", style);
    map.setStyle(style.url);
});

map.on('moveend', () => {
    if (debugMode) {
        // Log the map center and zoom level after moving the map
        console.log("Map moved to:", map.getCenter().toArray(), "Zoom level:", map.getZoom());
    }
    localStorage.setItem('mapCenter', JSON.stringify(map.getCenter().toArray()));
    localStorage.setItem('mapZoom', map.getZoom().toString());
});

ApiProvider.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, () => {
    ApiProvider.getInstance().loadAllData();
});

ApiProvider.getInstance().loadAllData();

console.log("MapLibre WebMap initialized");