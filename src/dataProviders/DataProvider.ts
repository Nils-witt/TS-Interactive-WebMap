import type {NamedGeoReferencedObject} from "../enitites/NamedGeoReferencedObject.ts";
import type {LayerInfo} from "../types/LayerInfo.ts";
import {IMapGroup} from "../types/MapEntity.ts";


export interface DataProviderEvent {
    type: string; // Event type, e.g., 'mapLocationsUpdated'
    data: any; // Optional data associated with the event
}

export enum DataProviderEventType {
    MAP_LOCATIONS_UPDATED = 'mapLocations-updated',
    MAP_STYLE_UPDATED = 'mapStyle-updated',
    MAP_GROUPS_UPDATED = 'mapGroups-updated',
    OVERLAY_ADDED = 'overlay-added',
    LOGIN_SUCCESS = 'login-success',
    LOGIN_FAILURE = 'login-failure'
}

export class DataProvider {

    private mapLocations = new Map<string, NamedGeoReferencedObject>();
    private eventListeners: Map<string, ((event: DataProviderEvent) => void)[]> = new Map();
    private mapStyle: LayerInfo | undefined;
    private overlays: Map<string, LayerInfo> = new Map();

    private mapGroups: Map<string, IMapGroup> = new Map();

    public constructor() {
    }

    private triggerEvent(eventType: string, data: any): void {
        this.eventListeners.get(eventType)?.forEach(callback => {
            callback({type: eventType, data});
        });
    }

    addMapLocation(id: string, item: NamedGeoReferencedObject): void {
        this.mapLocations.set(id, item);
        this.triggerEvent(DataProviderEventType.MAP_LOCATIONS_UPDATED, [item]);
    }

    getMapLocations(): Map<string, NamedGeoReferencedObject> {
        return this.mapLocations;
    }

    addMapGroup(id: string, group: IMapGroup): void {
        this.mapGroups.set(id, group);
        this.triggerEvent(DataProviderEventType.MAP_GROUPS_UPDATED, group);
    }

    getMapGroups(): Map<string, IMapGroup> {
        return this.mapGroups;
    }

    setMapStyle(style: LayerInfo): void {
        this.mapStyle = style;
        this.triggerEvent(DataProviderEventType.MAP_STYLE_UPDATED, style);
    }

    getMapStyle(): LayerInfo | undefined {
        return this.mapStyle;
    }

    addOverlay(id: string, overlay: LayerInfo): void {
        this.overlays.set(id, overlay);
        this.triggerEvent(DataProviderEventType.OVERLAY_ADDED, overlay);
    }

    getOverlays(): Map<string, LayerInfo> {
        return this.overlays;
    }

    on(event: string, callback: (event: DataProviderEvent) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(callback);
    }
}