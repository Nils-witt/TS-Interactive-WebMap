/**
 * Main entry point for the MapLibre WebMap application.
 * This file initializes the map, loads available layers, and sets up the UI controls.
 */
/// <reference lib="dom" />
import 'maplibre-gl/dist/maplibre-gl.css';
import {GeolocateControl, Map as MapLibreMap, NavigationControl} from 'maplibre-gl';
import type {LayerInfo} from "./common_components/types/LayerInfo";
import {ApiProvider, ApiProviderEventTypes} from "./common_components/ApiProvider";
import {DrawingController} from "./controls/DrawingController";
import {DataProvider, DataProviderEvent, DataProviderEventType, ViewMode} from "./common_components/DataProvider";
import {EditorController} from "./controls/EditorController";
import {SearchControl} from "./common_components/controls/SearchControl";
import {MapEditContextMenu} from "./controls/MapEditContextMenu";
import './style.css'
import {LoginController} from "./common_components/controls/LoginController";
import {LayersControl} from "./common_components/controls/LayerControl";
import {registerSW} from "virtual:pwa-register";
import {GlobalEventHandler} from "./common_components/GlobalEventHandler";
import {loadBrowserConfig} from "./BrowserHelper";


if (window.location.pathname === '/') {
    window.location.pathname = '/index.html';
}

navigator.serviceWorker.addEventListener("message", (event) => {
    console.log(event.data.cmd);
    if (event.data.cmd === "reload") {
        console.log("Reloading page due to service worker update");
        window.location.reload();
    }
});

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

loadBrowserConfig()
console.log("Loading browser config");

const mapContainer = document.createElement('div');
const editorLayout = document.createElement('div');
const editorControls = document.createElement('div');

mapContainer.id = 'map';
mapContainer.innerText = 'Error loading the map';
mapContainer.classList.add('w-full'); // Add a class for styling
mapContainer.classList.add('h-full'); // Add a class for styling




if (DataProvider.getInstance().getMode() == ViewMode.EDIT) {
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
    center: DataProvider.getInstance().getMapCenter(),                                     // Initial center of the map
    zoom: DataProvider.getInstance().getMapZoom(),                                         // Initial zoom level
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

if (DataProvider.getInstance().getMode() != ViewMode.EDIT) {
    map.addControl(geolocate, 'top-right'); // Add geolocation control to the map
    map.addControl(searchControl, 'top-left');
}

drawingController.addTo(map); // Set the map for the drawing controller


if (DataProvider.getInstance().getMode() == ViewMode.EDIT) {
    const editorController = new EditorController(editorControls, map);
    new MapEditContextMenu({
        map: map,
        editor: editorController
    });
}

GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_STYLE_UPDATED, (event) => {
    const e: DataProviderEvent = event as DataProviderEvent;
    const style = e.data as LayerInfo;
    console.log("Setting map style to:", style);
    map.setStyle(style.url);
});

map.on('moveend', () => {
    //TODO Replace
    localStorage.setItem('mapCenter', JSON.stringify(map.getCenter().toArray()));
    localStorage.setItem('mapZoom', map.getZoom().toString());
});

GlobalEventHandler.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, () => {
    ApiProvider.getInstance().loadAllData();
});

ApiProvider.getInstance().loadAllData();

console.log("MapLibre WebMap initialized");