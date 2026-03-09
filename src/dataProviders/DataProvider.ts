/*
 * DataProvider.ts
 * ----------------
 * Central in-memory store and event hub for map data (styles, overlays, named locations).
 * Exports: DataProvider singleton and DataProviderEventType enum
 * Purpose: keep app components synchronized and provide API token & data mutation helpers.
 */

import { type MapItem } from '../enitities/MapItem.ts';
import { GlobalEventHandler } from './GlobalEventHandler';
import { LngLat } from 'maplibre-gl';
import { MapOverlay } from '../enitities/MapOverlay.ts';
import { MapBaseLayer } from '../enitities/MapBaseLayer.ts';
import { type MapGroup } from '../enitities/MapGroup.ts';
import type { Unit } from '../enitities/Unit.ts';
import { MapConfig } from '../enitities/MapConfig.ts';
import type { User } from '../enitities/User.ts';
import type { MissionGroup } from '../enitities/MissionGroup.ts';

/**
 * Interface representing an event dispatched by the DataProvider.
 * Used for the pub/sub pattern to notify subscribers of data changes.
 */
export class DataProviderEvent extends Event {
    /** Event type identifier, corresponds to DataProviderEventType values */
    eventType: string;
    /** Data payload associated with the event */
    data: number | object | string | boolean;

    constructor(eventType: string, data: string | object | number | boolean) {
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

    UNIT_ADDED = 'unit-added',
    UNIT_UPDATED = 'unit-updated',
    UNIT_DELETED = 'unit-deleted',

    USER_ADDED = 'user-added',
    USER_UPDATED = 'user-updated',
    USER_DELETED = 'user-deleted',

    MISSION_GROUPS_CREATED = 'missionGroups-created',
    MISSION_GROUPS_UPDATED = 'missionGroups-updated',
    MISSION_GROUPS_DELETED = 'missionGroups-deleted',

    ACTIVE_USER_UPDATED = 'active-user-updated',

    MAP_CENTER_UPDATED = 'map-center-updated',
    MAP_ZOOM_UPDATED = 'map-zoom-updated',
    API_URL_UPDATED = 'api-url-updated',
    API_TOKEN_UPDATED = 'api-token-updated',
    MAP_CONFIG_UPDATED = 'map-config-updated',
    /** Triggered when the set of active (visible) overlay IDs changes */
    ACTIVE_OVERLAYS_UPDATED = 'active-overlays-updated',
}

/**
 * Singleton class that manages all map-related data and provides an event system
 * for notifying components about data changes.
 *
 * Uses the Singleton pattern to ensure only one instance exists throughout the application.
 */
export class DataProvider {
    /** Storage for map location objects, indexed by their IDs */
    private mapLocations = new Map<string, MapItem>();

    /** Current map style configuration */
    private mapStyle: MapBaseLayer | undefined;

    /** Collection of overlay layers that can be added to the map */
    private overlays: Map<string, MapOverlay> = new Map<string, MapOverlay>();

    /** Collection of map groups for organizing map elements */
    private mapGroups: Map<string, MapGroup> = new Map<string, MapGroup>();

    /** Collection of mission groups for organizing mission-related data */
    private missionGroups: Map<string, MissionGroup> = new Map<string, MissionGroup>();

    private units: Map<string, Unit> = new Map<string, Unit>();

    private users: Map<string, User> = new Map<string, User>();

    private mapCenter: LngLat = new LngLat(0.0, 0.0); // Default center of the map
    private mapZoom: number;

    private mapConfig: MapConfig = new MapConfig();

    private activeUser: User | null = null;
    private activeUserId: string | null = null;

    /** Set of overlay IDs that are currently visible, persisted to localStorage */
    private activeOverlays: Set<string>;

    /** Singleton instance reference */
    private static instance: DataProvider;

    /**
     * Private constructor to prevent direct instantiation.
     * Part of the Singleton pattern implementation.
     */
    private constructor() {
        this.mapZoom = 2; // Default zoom level
        this.activeOverlays = new Set(JSON.parse(localStorage.getItem('activeOverlays') ?? '[]') as string[]);
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


    public obtainActiveUser(): void {
        const activeUserId = localStorage.getItem('activeUser');
        this.activeUserId = activeUserId ? activeUserId : null;
        const lUser = this.users.get(this.activeUserId as string);
        if (lUser != undefined) {
            this.activeUser = lUser;
        }else {
            this.activeUser = null;
        }
        if (activeUserId) {
            this.triggerEvent(DataProviderEventType.ACTIVE_USER_UPDATED, this.activeUser as object);
        }
    }

    public setActiveUserId(userId: string): void {
        localStorage.setItem('activeUser', userId);
        this.activeUserId = userId;
        const lUser = this.users.get(userId);
        if (lUser != undefined) {
            this.activeUser = lUser;
        }else {
            this.activeUser = null;
        }
        this.triggerEvent(DataProviderEventType.ACTIVE_USER_UPDATED, this.activeUser as object);
    }

    /**
     * Adds a new map location to the data store and notifies subscribers.
     *
     * @param id - Unique identifier for the location
     * @param item - The location object to store
     */
    public addMapItem(item: MapItem): void {
        if (this.mapLocations.has(item.getId() as string)) {
            this.mapLocations.set(item.getId() as string, item);
            this.triggerEvent(DataProviderEventType.MAP_ITEM_UPDATED, item);
        } else {
            this.mapLocations.set(item.getId() as string, item);
            this.triggerEvent(DataProviderEventType.MAP_ITEM_CREATED, item);
        }
    }

    /**
     * Retrieves all stored map locations.
     *
     * @returns Map of all location objects indexed by their IDs
     */
    public getAllMapItems(): Map<string, MapItem> {
        return this.mapLocations;
    }


    public deleteMapItem(id: string): void {
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
    public addMapGroup(group: MapGroup): void {
        const id = group.getId();
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
    public getAllMapGroups(): Map<string, MapGroup> {
        return this.mapGroups;
    }

    /**
     * Sets the current map style and notifies subscribers.
     *
     * @param style - The map style configuration to use
     */
    public setMapStyle(style: MapBaseLayer): void {
        this.mapStyle = style;
        this.triggerEvent(DataProviderEventType.MAP_STYLE_UPDATED, style);
    }

    /**
     * Retrieves the current map style configuration.
     *
     * @returns The current map style or undefined if not set
     */
    public getMapStyle(): MapBaseLayer | undefined {
        return this.mapStyle;
    }

    /**
     * Adds a new overlay layer to the data store and notifies subscribers.
     *
     * @param id - Unique identifier for the overlay
     * @param overlay - The overlay configuration to store
     */
    public addMapOverlay(overlay: MapOverlay): void {
        if (this.overlays.has(overlay.getId())) {
            this.overlays.set(overlay.getId(), overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_UPDATED, overlay);
        } else {
            this.overlays.set(overlay.getId(), overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_ADDED, overlay);
        }
    }

    public removeMapOverlay(id: string): void {
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
    public getAllMapOverlays(): Map<string, MapOverlay> {
        return this.overlays;
    }

    public addUnit(unit: Unit): void {
        if (unit.getId()) {
            if (this.units.has(unit.getId() as string)) {
                this.units.set(unit.getId() as string, unit);
                this.triggerEvent(DataProviderEventType.UNIT_UPDATED, unit);
            } else {
                this.units.set(unit.getId() as string, unit);
                this.triggerEvent(DataProviderEventType.UNIT_ADDED, unit);
            }
        }
    }

    public getAllUnits(): Map<string, Unit> {
        return this.units;
    }

    public removeUnit(id: string): void {
        if (this.units.has(id)) {
            const unit = this.units.get(id);
            if (!unit) return;
            this.units.delete(id);
            this.triggerEvent(DataProviderEventType.UNIT_DELETED, unit);
        }
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
        localStorage.setItem('apiUrl', url);
        this.triggerEvent(DataProviderEventType.API_URL_UPDATED, url);
    }

    public getApiUrl(): string {
        return localStorage.getItem('apiUrl') || '/api';
    }

    public setApiToken(token: string): void {
        localStorage.setItem('apiToken', token);
        this.triggerEvent(DataProviderEventType.API_TOKEN_UPDATED, token);
    }

    public getApiToken(): string {
        return localStorage.getItem('apiToken') || '';
    }


    public getMapConfig(): MapConfig {
        return this.mapConfig;
    }

    public setMapConfig(value: MapConfig) {
        this.mapConfig = value;
        this.triggerEvent(DataProviderEventType.MAP_CONFIG_UPDATED, value);
    }

    /** Returns the set of overlay IDs that are currently marked as visible. */
    public getActiveMapOverlays(): Set<string> {
        return this.activeOverlays;
    }

    /**
     * Replaces the active overlay set, persists to localStorage and emits an event.
     *
     * @param ids - Set of overlay IDs that should be visible
     */
    public setActiveMapOverlays(ids: Set<string>): void {
        this.activeOverlays = ids;
        localStorage.setItem('activeOverlays', JSON.stringify(Array.from(ids)));
        this.triggerEvent(DataProviderEventType.ACTIVE_OVERLAYS_UPDATED, Array.from(ids));
    }

    public on(eventType: string, listener: (event: DataProviderEvent) => void): void {
        GlobalEventHandler.getInstance().on(eventType, listener as ((event: Event) => void));
    }

    public off(eventType: string, listener: (event: DataProviderEvent) => void): void {
        GlobalEventHandler.getInstance().off(eventType, listener as ((event: Event) => void));
    }

    public addUser(user: User): void {
        if (this.users.has(user.getId())) {
            this.users.set(user.getId(), user);
            this.triggerEvent(DataProviderEventType.USER_UPDATED, user);
        } else {
            this.users.set(user.getId(), user);
            this.triggerEvent(DataProviderEventType.USER_ADDED, user);
        }

        if (user.getId() === this.activeUserId) {
            this.activeUser = user;
            this.triggerEvent(DataProviderEventType.ACTIVE_USER_UPDATED, this.activeUser as object);
        }
    }

    public getAllUsers(): Map<string, User> {
        return this.users;
    }

    public removeUser(id: string): void {
        if (this.users.has(id)) {
            const user = this.users.get(id);
            if (!user) return;
            this.users.delete(id);
            this.triggerEvent(DataProviderEventType.USER_DELETED, user);
        }
    }

    public addMissionGroup(missionGroup: MissionGroup): void {
        if (this.missionGroups.has(missionGroup.getId())) {
            this.missionGroups.set(missionGroup.getId(), missionGroup);
            this.triggerEvent(DataProviderEventType.MISSION_GROUPS_UPDATED, missionGroup);
        } else {
            this.missionGroups.set(missionGroup.getId(), missionGroup);
            this.triggerEvent(DataProviderEventType.MISSION_GROUPS_CREATED, missionGroup);
        }
    }

    public getAllMissionGroups(): Map<string, MissionGroup> {
        return this.missionGroups;
    }

    public removeMissionGroup(id: string): void {
        if (this.missionGroups.has(id)) {
            const missionGroup = this.missionGroups.get(id);
            if (!missionGroup) return;
            this.missionGroups.delete(id);
            this.triggerEvent(DataProviderEventType.MISSION_GROUPS_DELETED, missionGroup);
        }
    }

}