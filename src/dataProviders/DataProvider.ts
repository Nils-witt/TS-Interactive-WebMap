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
import type {LayerInfo} from "../types/LayerInfo";
import type {IMapGroup} from "../types/MapEntity";
import {GlobalEventHandler} from "./GlobalEventHandler";
import {LngLat} from "maplibre-gl";

/**
 * Interface representing an event dispatched by the DataProvider.
 * Used for the pub/sub pattern to notify subscribers of data changes.
 */
export class DataProviderEvent extends Event {
    /** Event type identifier, corresponds to DataProviderEventType values */
    type: string;
    /** Data payload associated with the event */
    data: number | object | string;

    constructor(type: string, data: string | object | number) {
        super(type);
        this.type = type;
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
    MAP_GROUPS_CREATED = 'mapGroups-created',
    MAP_GROUPS_DELETED = 'mapGroups-deleted',
    /** Triggered when a new overlay is added to the map */
    OVERLAY_ADDED = 'overlay-added',
    /** Triggered when an existing overlay is updated */
    OVERLAY_UPDATED = 'overlay-updated',
    /** Triggered when an overlay is removed **/
    OVERLAY_DELETED = 'overlay-deleted',

    VIEW_MODE_CHANGED = 'view-mode-changed',
    MAP_CENTER_UPDATED = 'map-center-updated',
    MAP_ZOOM_UPDATED = 'map-zoom-updated',
    API_URL_UPDATED = 'api-url-updated',
    API_TOKEN_UPDATED = 'api-token-updated',
}

export enum ViewMode {
    VIEW = 'view',
    EDIT = 'edit'
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
    private mapStyle: LayerInfo | undefined;

    /** Collection of overlay layers that can be added to the map */
    private overlays: Map<string, LayerInfo> = new Map();

    /** Collection of map groups for organizing map elements */
    private mapGroups: Map<string, IMapGroup> = new Map();


    private mapCenter: LngLat = new LngLat(0.0, 0.0); // Default center of the map
    private mapZoom: number = 1;
    private apiUrl: string = '';
    private apiToken: string = '';

    private mode: ViewMode = ViewMode.VIEW;

    /** Singleton instance reference */
    private static instance: DataProvider;

    /**
     * Private constructor to prevent direct instantiation.
     * Part of the Singleton pattern implementation.
     */
    private constructor() {
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
        }
        return DataProvider.instance;
    }

    /**
     * Dispatches an event to all registered listeners for the specified event type.
     *
     * @param eventType - The type of event to trigger
     * @param data - The data to include with the event
     */
    private triggerEvent(eventType: string, data: object | string | number): void {
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
    public setMapStyle(style: LayerInfo): void {
        this.mapStyle = style;
        this.triggerEvent(DataProviderEventType.MAP_STYLE_UPDATED, style);
    }

    /**
     * Retrieves the current map style configuration.
     *
     * @returns The current map style or undefined if not set
     */
    public getMapStyle(): LayerInfo | undefined {
        return this.mapStyle;
    }

    /**
     * Adds a new overlay layer to the data store and notifies subscribers.
     *
     * @param id - Unique identifier for the overlay
     * @param overlay - The overlay configuration to store
     */
    public addOverlay(id: string, overlay: LayerInfo): void {
        if (this.overlays.has(id)) {
            this.overlays.set(id, overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_UPDATED, overlay);
        } else {
            this.overlays.set(id, overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_ADDED, overlay);
        }
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
    public getOverlays(): Map<string, LayerInfo> {
        return this.overlays;
    }

    public getMode(): ViewMode {
        return this.mode;
    }

    public setViewMode(mode: ViewMode): void {
        if (this.mode == mode) return;

        this.mode = mode;
        this.triggerEvent(DataProviderEventType.VIEW_MODE_CHANGED, mode);
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

}