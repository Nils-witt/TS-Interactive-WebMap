/**
 * DataProvider.ts
 *
 * This file implements a data management system for map-related data using the Singleton pattern.
 * It provides centralized storage and event-based communication for map locations, styles, groups,
 * and overlays. The DataProvider acts as a central hub for all map data, allowing components
 * to subscribe to data changes through an event system.
 *
 * Future implementation will include BroadcastChannel communication for cross-tab synchronization.
 */

import type {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject";
import type {IMapGroup} from "../types/MapEntity";
import {GlobalEventHandler} from "./GlobalEventHandler";
import {LngLat} from "maplibre-gl";
import {DatabaseProvider} from "./DatabaseProvider.ts";
import {Overlay} from "../enitities/Overlay.ts";
import {MapStyle} from "../enitities/MapStyle.ts";

/**
 * Interface representing an event dispatched by the DataProvider.
 * Used for the pub/sub pattern to notify subscribers of data changes.
 */
export class DataProviderEvent extends Event {
    /** Event type identifier, corresponds to DataProviderEventType values */
    eventType: string;
    /** Data payload associated with the event */
    data: number | object | string;

    constructor(eventType: string, data: string | object | number) {
        super(eventType);
        this.eventType = eventType;
        this.data = data;
    }
}

/**
 * Enumeration of all possible event types that can be dispatched by the DataProvider.
 * Used to standardize event type strings and prevent typos.
 */
export enum DataProviderEventType {
    /** Triggered when a map location is created */
    MAP_ITEM_CREATED = 'mapLocations-created',
    /** Triggered when a map location is updated */
    MAP_ITEM_UPDATED = 'mapLocations-updated',
    /** Triggered when a map location is deleted */
    MAP_ITEM_DELETED = 'mapLocation-deleted',
    /** Triggered when the base map style is changed */
    MAP_STYLE_UPDATED = 'mapStyle-updated',
    /** Triggered when map groups are added or updated */
    MAP_GROUPS_UPDATED = 'mapGroups-updated',
    /** Triggered when a new map group is created */
    MAP_GROUPS_CREATED = 'mapGroups-created',
    /** Triggered when a map group is deleted */
    MAP_GROUPS_DELETED = 'mapGroups-deleted',
    /** Triggered when a new overlay is added to the map */
    OVERLAY_ADDED = 'overlay-added',
    /** Triggered when an existing overlay is updated */
    OVERLAY_UPDATED = 'overlay-updated',
    /** Triggered when an overlay is removed **/
    OVERLAY_DELETED = 'overlay-deleted',

    MAP_CENTER_UPDATED = 'map-center-updated',
    MAP_ZOOM_UPDATED = 'map-zoom-updated',
    API_URL_UPDATED = 'api-url-updated',
    API_TOKEN_UPDATED = 'api-token-updated',
}

/**
 * Singleton class that manages all map-related data and provides an event system
 * for notifying components about data changes.
 *
 * Uses the Singleton pattern to ensure only one instance exists throughout the application.
 */
export class DataProvider {
    /** Storage for map location objects, indexed by their IDs */
    private mapLocations = new Map<string, NamedGeoReferencedObject>();

    /** Current map style configuration */
    private mapStyle: MapStyle | undefined;

    /** Collection of overlay layers that can be added to the map */
    private overlays: Map<string, Overlay> = new Map<string, Overlay>();

    /** Collection of map groups for organizing map elements */
    private mapGroups: Map<string, IMapGroup> = new Map<string, IMapGroup>();


    private mapCenter: LngLat = new LngLat(0.0, 0.0); // Default center of the map
    private mapZoom: number;

    /** Singleton instance reference */
    private static instance: DataProvider;

    /**
     * Private constructor to prevent direct instantiation.
     * Part of the Singleton pattern implementation.
     */
    private constructor() {
        this.mapZoom = 2; // Default zoom level
    }

    /**
     * Gets the singleton instance of DataProvider.
     * Creates the instance if it doesn't exist yet.
     *
     * @returns The singleton DataProvider instance
     */
    public static getInstance(): DataProvider {
        if (!DataProvider.instance) {
            DataProvider.instance = new DataProvider();
            void DataProvider.instance.loadFromDB();
        }
        return DataProvider.instance;
    }

    public async loadFromDB() {
        console.log("Loading data from database...");
        const dbProvider = await DatabaseProvider.getInstance();

        const overlays = await dbProvider.getAllOverlays();

        for (const overlayDB of overlays) {
            const overlay = Overlay.of(overlayDB);
            if (this.overlays.has(overlay.getId())) {
                this.overlays.set(overlay.getId(), overlay);
                this.triggerEvent(DataProviderEventType.OVERLAY_UPDATED, overlay);
            } else {
                this.overlays.set(overlay.getId(), overlay);
                this.triggerEvent(DataProviderEventType.OVERLAY_ADDED, overlay);
            }
        }
        const mapStyles = await dbProvider.getAllMapStyles();
        for (const mapStyle of mapStyles) {
            const style = MapStyle.of(mapStyle);
            this.mapStyle = style;
            this.triggerEvent(DataProviderEventType.MAP_STYLE_UPDATED, style);
        }
    }

    /**
     * Dispatches an event to all registered listeners for the specified event type.
     *
     * @param eventType - The type of event to trigger
     * @param data - The data to include with the event
     */
    private triggerEvent(eventType: string, data: object | string | number): void {
        console.log("Triggering event:", eventType, data);
        GlobalEventHandler.getInstance().emit(eventType, new DataProviderEvent(eventType, data));
    }

    /**
     * Adds a new map location to the data store and notifies subscribers.
     *
     * @param id - Unique identifier for the location
     * @param item - The location object to store
     */
    public addMapItem(item: NamedGeoReferencedObject): void {
        if (this.mapLocations.has(item.getId())) {
            this.mapLocations.set(item.getId(), item);
            this.triggerEvent(DataProviderEventType.MAP_ITEM_UPDATED, item);
        } else {
            this.mapLocations.set(item.getId(), item);
            this.triggerEvent(DataProviderEventType.MAP_ITEM_CREATED, item);
        }
    }

    /**
     * Retrieves all stored map locations.
     *
     * @returns Map of all location objects indexed by their IDs
     */
    public getMapLocations(): Map<string, NamedGeoReferencedObject> {
        return this.mapLocations;
    }


    public deleteMapLocation(id: string): void {
        if (this.mapLocations.has(id)) {
            const item = this.mapLocations.get(id);
            this.mapLocations.delete(id);
            this.triggerEvent(DataProviderEventType.MAP_ITEM_DELETED, [item]);
        } else {
            console.warn(`Map location with ID ${id} does not exist.`);
        }
    }

    /**
     * Adds a new map group to the data store and notifies subscribers.
     *
     * @param id - Unique identifier for the group
     * @param group - The map group object to store
     */
    public addMapGroup(id: string, group: IMapGroup): void {
        if (this.mapGroups.has(id)) {
            this.mapGroups.set(id, group);
            this.triggerEvent(DataProviderEventType.MAP_GROUPS_UPDATED, group);
        } else {
            this.mapGroups.set(id, group);
            this.triggerEvent(DataProviderEventType.MAP_GROUPS_CREATED, group);
        }
    }

    /**
     * Retrieves all stored map groups.
     *
     * @returns Map of all group objects indexed by their IDs
     */
    public getMapGroups(): Map<string, IMapGroup> {
        return this.mapGroups;
    }

    /**
     * Sets the current map style and notifies subscribers.
     *
     * @param style - The map style configuration to use
     */
    public setMapStyle(style: MapStyle): void {
        this.mapStyle = style;
        void DatabaseProvider.getInstance().then(instance => {
            instance.saveMapStyle({
                id: style.getID(),
                name: style.getName(),
                url: style.getUrl()
            });
        })
        this.triggerEvent(DataProviderEventType.MAP_STYLE_UPDATED, style);
    }

    /**
     * Retrieves the current map style configuration.
     *
     * @returns The current map style or undefined if not set
     */
    public getMapStyle(): MapStyle | undefined {
        return this.mapStyle;
    }

    /**
     * Adds a new overlay layer to the data store and notifies subscribers.
     *
     * @param id - Unique identifier for the overlay
     * @param overlay - The overlay configuration to store
     */
    public addOverlay(overlay: Overlay): void {
        if (this.overlays.has(overlay.getId())) {
            this.overlays.set(overlay.getId(), overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_UPDATED, overlay);
        } else {
            this.overlays.set(overlay.getId(), overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_ADDED, overlay);
        }
        void DatabaseProvider.getInstance().then(instance => {
            instance.saveOverlay({
                id: overlay.getId(),
                name: overlay.getName(),
                url: overlay.getUrl(),
                order: overlay.getOrder(),
                opacity: overlay.getOpacity(),
                description: overlay.getDescription()
            });
        })
    }

    public removeOverlay(id: string): void {
        if (this.overlays.has(id)) {
            const overlay = this.overlays.get(id);
            if (!overlay) return;
            this.overlays.delete(id);
            this.triggerEvent(DataProviderEventType.OVERLAY_DELETED, overlay);
        } else {
            console.warn(`Overlay with ID ${id} does not exist.`);
        }
    }

    /**
     * Retrieves all stored overlay layers.
     *
     * @returns Map of all overlay configurations indexed by their IDs
     */
    public getOverlays(): Map<string, Overlay> {
        return this.overlays;
    }

    public getMapCenter(): LngLat {
        return this.mapCenter;
    }

    public setMapCenter(center: LngLat): void {
        this.mapCenter = center;
        this.triggerEvent(DataProviderEventType.MAP_CENTER_UPDATED, center);
    }

    public getMapZoom(): number {
        return this.mapZoom;
    }

    public setMapZoom(zoom: number): void {
        this.mapZoom = zoom;
        this.triggerEvent(DataProviderEventType.MAP_ZOOM_UPDATED, zoom);

    }

    public setApiUrl(url: string): void {
        localStorage.setItem('apiUrl', url)
        this.triggerEvent(DataProviderEventType.API_URL_UPDATED, url);
    }

    public getApiUrl(): string {
        return localStorage.getItem('apiUrl') || '/api';
    }

    public setApiToken(token: string): void {
        localStorage.setItem('apiToken', token)
        this.triggerEvent(DataProviderEventType.API_TOKEN_UPDATED, token);
    }

    public getApiToken(): string {
        return localStorage.getItem('apiToken') || '';
    }

    public on(eventType: string, listener: (event: DataProviderEvent) => void): void {
        GlobalEventHandler.getInstance().on(eventType, listener as ((event: Event) => void));
    }

}