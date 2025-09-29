import type {INamedGeoReferencedObject} from "../types/MapEntity.ts";
import type {TaktischesZeichen} from "taktische-zeichen-core/dist/types/types";


export class NamedGeoReferencedObject implements INamedGeoReferencedObject {
    id: string;
    latitude: number;
    longitude: number;
    name: string;
    zoomLevel?: number;
    showOnMap?: boolean;
    symbol?: TaktischesZeichen; // Optional symbol for rendering, if applicable
    groupId?: string | undefined; // Optional group ID for categorization

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
}