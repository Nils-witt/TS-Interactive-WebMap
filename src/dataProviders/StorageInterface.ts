/*
 * StorageInterface.ts
 * -------------------
 * Type definitions for storage provider interfaces used by the app.
 * Exports: StorageInterface and KeyValueInterface types
 * Purpose: standardize methods for local and remote storage providers.
 */

import type {Overlay} from '../enitities/Overlay.ts';
import type {MapStyle} from '../enitities/MapStyle.ts';
import type {NamedGeoReferencedObject} from '../enitities/NamedGeoReferencedObject.ts';


export interface StorageInterface {

    setUp(): Promise<void>;

    saveOverlay(overlay: Overlay): Promise<Overlay>;

    replaceOverlays(overlays: Overlay[]): Promise<void>;

    loadOverlay(id: string): Promise<Overlay | null>;

    loadAllOverlays(): Promise<Record<string, Overlay>>;

    deleteOverlay(id: string): Promise<boolean>;

    saveMapStyle(mapStyle: MapStyle): Promise<MapStyle>;

    replaceMapStyles(mapStyles: MapStyle[]): Promise<void>;

    loadMapStyle(id: string): Promise<MapStyle | null>;

    loadAllMapStyles(): Promise<Record<string, MapStyle>>;

    deleteMapStyle(id: string): Promise<void>;

    saveNamedGeoReferencedObject(namedGeoReferencedObject: NamedGeoReferencedObject): Promise<NamedGeoReferencedObject>;

    replaceNamedGeoReferencedObjects(namedGeoReferencedObjects: NamedGeoReferencedObject[]): Promise<void>;

    loadNamedGeoReferencedObject(id: string): Promise<NamedGeoReferencedObject | null>;

    loadAllNamedGeoReferencedObjects(): Promise<Record<string, NamedGeoReferencedObject>>;

    deleteNamedGeoReferencedObject(id: string): Promise<void>;

}