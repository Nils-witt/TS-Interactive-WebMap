/*
 * StorageInterface.ts
 * -------------------
 * Type definitions for storage provider interfaces used by the app.
 * Exports: StorageInterface and KeyValueInterface types
 * Purpose: standardize methods for local and remote storage providers.
 */

import type {MapOverlay} from '../enitities/MapOverlay.ts';
import type {MapBaseLayer} from '../enitities/MapBaseLayer.ts';
import type {MapItem} from '../enitities/MapItem.ts';
import type {MapGroup} from '../enitities/MapGroup.ts';
import type {Unit} from '../enitities/Unit.ts';


export interface StorageInterface {

    setUp(): Promise<void>;

    saveOverlay(overlay: MapOverlay): Promise<MapOverlay>;

    replaceOverlays(overlays: MapOverlay[]): Promise<void>;

    loadOverlay(id: string): Promise<MapOverlay | null>;

    loadAllOverlays(): Promise<Record<string, MapOverlay>>;

    deleteOverlay(id: string): Promise<boolean>;

    saveMapStyle(mapStyle: MapBaseLayer): Promise<MapBaseLayer>;

    replaceMapStyles(mapStyles: MapBaseLayer[]): Promise<void>;

    loadMapStyle(id: string): Promise<MapBaseLayer | null>;

    loadAllMapStyles(): Promise<Record<string, MapBaseLayer>>;

    deleteMapStyle(id: string): Promise<void>;

    saveNamedGeoReferencedObject(namedGeoReferencedObject: MapItem): Promise<MapItem>;

    replaceNamedGeoReferencedObjects(namedGeoReferencedObjects: MapItem[]): Promise<void>;

    loadNamedGeoReferencedObject(id: string): Promise<MapItem | null>;

    loadAllNamedGeoReferencedObjects(): Promise<Record<string, MapItem>>;

    deleteNamedGeoReferencedObject(id: string): Promise<void>;

    loadMapGroup(id: string): Promise<MapGroup | null>;

    loadAllMapGroups(): Promise<Record<string, MapGroup>>;

    saveMapGroup(mapGroup: MapGroup): Promise<MapGroup>;

    replaceMapGroups(mapGroups: MapGroup[]): Promise<void>;

    deleteMapGroup(id: string): Promise<void>;

    saveUnit(unit: Unit): Promise<Unit>;

    deleteUnit(id: string): Promise<void>;

    loadUnit(id: string): Promise<Unit | null>;

    loadAllUnits(): Promise<Record<string, Unit>>;

    replaceUnits(units: Unit[]): Promise<void>;
}