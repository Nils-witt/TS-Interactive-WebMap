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

import type {NamedGeoReferencedObject} from "../common_components/enitites/NamedGeoReferencedObject.ts";
import type {LayerInfo} from "../types/LayerInfo.ts";
import {IMapGroup} from "../types/MapEntity.ts";

/**
 * Interface representing an event dispatched by the DataProvider.
 * Used for the pub/sub pattern to notify subscribers of data changes.
 */
export interface DataProviderEvent {
    /** Event type identifier, corresponds to DataProviderEventType values */
    type: string; // Event type, e.g., 'mapLocationsUpdated'
    /** Data payload associated with the event */
    data: any; // Optional data associated with the event
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

    /** Registry of event listeners, organized by event type */
    private eventListeners: Map<string, ((event: DataProviderEvent) => void)[]> = new Map();

    /** Current map style configuration */
    private mapStyle: LayerInfo | undefined;

    /** Collection of overlay layers that can be added to the map */
    private overlays: Map<string, LayerInfo> = new Map();

    /** Collection of map groups for organizing map elements */
    private mapGroups: Map<string, IMapGroup> = new Map();
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
    private triggerEvent(eventType: string, data: any): void {
        this.eventListeners.get(eventType)?.forEach(callback => {
            callback({type: eventType, data});
        });
    }

    /**
     * Adds a new map location to the data store and notifies subscribers.
     *
     * @param id - Unique identifier for the location
     * @param item - The location object to store
     */
    addMapItem(id: string, item: NamedGeoReferencedObject): void {
        if (this.mapLocations.has(id)) {
            this.mapLocations.set(id, item);
            this.triggerEvent(DataProviderEventType.MAP_ITEM_UPDATED, item);
        } else {
            this.mapLocations.set(id, item);
            this.triggerEvent(DataProviderEventType.MAP_ITEM_CREATED, item);
        }
    }

    /**
     * Retrieves all stored map locations.
     *
     * @returns Map of all location objects indexed by their IDs
     */
    getMapLocations(): Map<string, NamedGeoReferencedObject> {
        return this.mapLocations;
    }


    deleteMapLocation(id: string): void {
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
    addMapGroup(id: string, group: IMapGroup): void {
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
    getMapGroups(): Map<string, IMapGroup> {
        return this.mapGroups;
    }

    /**
     * Sets the current map style and notifies subscribers.
     *
     * @param style - The map style configuration to use
     */
    setMapStyle(style: LayerInfo): void {
        this.mapStyle = style;
        this.triggerEvent(DataProviderEventType.MAP_STYLE_UPDATED, style);
    }

    /**
     * Retrieves the current map style configuration.
     *
     * @returns The current map style or undefined if not set
     */
    getMapStyle(): LayerInfo | undefined {
        return this.mapStyle;
    }

    /**
     * Adds a new overlay layer to the data store and notifies subscribers.
     *
     * @param id - Unique identifier for the overlay
     * @param overlay - The overlay configuration to store
     */
    addOverlay(id: string, overlay: LayerInfo): void {
        if (this.overlays.has(id)) {
            this.overlays.set(id, overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_UPDATED, overlay);
        } else {
            this.overlays.set(id, overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_ADDED, overlay);
        }
    }

    removeOverlay(id: string): void {
        if (this.overlays.has(id)) {
            const overlay = this.overlays.get(id);
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
    getOverlays(): Map<string, LayerInfo> {
        return this.overlays;
    }

    /**
     * Registers an event listener for a specific event type.
     *
     * @param event - The event type to listen for
     * @param callback - Function to call when the event occurs
     */
    on(event: string, callback: (event: DataProviderEvent) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(callback);
    }
}