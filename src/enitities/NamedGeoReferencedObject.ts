import type {INamedGeoReferencedObject} from "../types/MapEntity.ts";
import type {TaktischesZeichen} from "taktische-zeichen-core/dist/types/types";


export class NamedGeoReferencedObject {
    private id: string;
    private latitude: number;
    private longitude: number;
    private name: string;
    private zoomLevel?: number;
    private showOnMap?: boolean;
    private symbol?: TaktischesZeichen; // Optional symbol for rendering, if applicable
    private groupId?: string | undefined; // Optional group ID for categorization

    constructor(data: INamedGeoReferencedObject) {
        this.id = data.id;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.name = data.name;
        this.zoomLevel = data.zoomLevel || 0; // Default zoom level to 0 if not provided
        this.showOnMap = data.showOnMap;
        this.symbol = data.symbol; // Optional symbol for rendering, if applicable
        this.groupId = data.groupId; // Optional group ID for categorization
    }

    public getId(): string {
        return this.id;
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

    public getZoomLevel(): number | undefined {
        return this.zoomLevel;
    }
    public getShowOnMap(): boolean | undefined {
        return this.showOnMap;
    }
    public getSymbol(): TaktischesZeichen | undefined {
        return this.symbol;
    }
    public getGroupId(): string | undefined {
        return this.groupId;
    }
    public setGroupId(groupId: string | undefined): void {
        this.groupId = groupId;
    }
    public getGeoReferencedObject(): INamedGeoReferencedObject {
        return {
            id: this.id,
            latitude: this.latitude,
            longitude: this.longitude,
            name: this.name,
            zoomLevel: this.zoomLevel,
        }
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
    public setSymbol(symbol: TaktischesZeichen): void {
        this.symbol = symbol;
    }

    public setLatitude(latitude: number): void {
        this.latitude = latitude;
    }
    public setLongitude(longitude: number): void {
        this.longitude = longitude;
    }


}