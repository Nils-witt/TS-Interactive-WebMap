import type {TaktischesZeichen} from "taktische-zeichen-core/dist/types/types";


export interface IAbstractEntity {
    id: string; // Unique identifier for the entity, used for source and layer creation
}

export interface IMapGroup extends IAbstractEntity {
    name: string; // Name of the group, used for display purposes
    description?: string; // Optional description of the group
}

export interface IGeoReferencedObject extends IAbstractEntity {
    latitude: number; // Latitude coordinate of the object
    longitude: number; // Longitude coordinate of the object
    zoomLevel?: number; // Optional zoom level for the object, used to control visibility at different zoom levels
    showOnMap?: boolean; // Flag to indicate if the object should be displayed on the map
    groupId?: string | undefined; // Optional group ID for categorization, used to group objects together
}

export interface INamedGeoReferencedObject extends IGeoReferencedObject {
    name: string; // Name of the object, used for display purposes
    description?: string; // Optional description of the object
    symbol?: TaktischesZeichen;
}