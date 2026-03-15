/*
 * NamedGeoReferencedObject.ts
 * ---------------------------
 * Represents a named, georeferenced point of interest used by the search control.
 * Exports: NamedGeoReferencedObject class
 * Purpose: store id, name, coordinates, optional zoom and metadata
 */

import { type DBRecord, type IAbstractEntity, AbstractEntity } from './AbstractEntity.ts';

export interface IMapItem extends IAbstractEntity {
    latitude: number;
    longitude: number;
    name: string;
    zoomLevel?: number;
    showOnMap?: boolean;
    groupId?: string | null;
}

export class MapItem extends AbstractEntity {
    private latitude: number;
    private longitude: number;
    private name: string;
    private zoomLevel: number;
    private showOnMap: boolean;
    private groupId: string | null;

    constructor(data: IMapItem) {
        super(data.id, data.createdAt, data.updatedAt, data.permissions);
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.name = data.name;
        this.zoomLevel = data.zoomLevel || 14;
        this.showOnMap = data.showOnMap || false;
        this.groupId = data.groupId as string | null;
    }

    public static of(data: DBRecord): MapItem {
        return new MapItem({
            id: data.id as string,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            name: data.name as string,
            zoomLevel: data.zoomLevel !== undefined ? Number(data.zoomLevel) : undefined,
            showOnMap: Boolean(data.show_on_map),
            groupId: data.group_id as string | undefined,
            createdAt: new Date(data.createdAt as string).getTime(),
            updatedAt: new Date(data.updatedAt as string).getTime(),
            permissions: data.permissions as string[],
        });
    }


    record(): DBRecord {
        return {
            ...super.record(),
            latitude: this.latitude,
            longitude: this.longitude,
            name: this.name,
            zoomLevel: this.zoomLevel || 0,
            group_id: this.groupId || null,
            show_on_map: this.showOnMap || false,
        };
    }

    public getLatitude(): number {
        return this.latitude;
    }

    public getLongitude(): number {
        return this.longitude;
    }

    public getName(): string {
        return this.name;
    }

    public getZoomLevel(): number {
        return this.zoomLevel;
    }

    public getShowOnMap(): boolean {
        return this.showOnMap;
    }

    public getGroupId(): string | null {
        return this.groupId;
    }

    public setGroupId(groupId: string | null): void {
        this.groupId = groupId;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public setZoomLevel(zoomLevel: number): void {
        this.zoomLevel = zoomLevel;
    }

    public setShowOnMap(showOnMap: boolean): void {
        this.showOnMap = showOnMap;
    }

    public setLatitude(latitude: number): void {
        this.latitude = latitude;
    }

    public setLongitude(longitude: number): void {
        this.longitude = longitude;
    }
}