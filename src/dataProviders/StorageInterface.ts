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
import type { Photo } from '../enitities/Photo.ts';
import type { User } from '../enitities/User.ts';
import type { MissionGroup } from '../enitities/MissionGroup.ts';
import type { IPosition } from '../enitities/embeddables/EmbeddablePosition.ts';


export interface StorageInterface {

    setUp(): Promise<void>;

    loadAllUnits(): Promise<Record<string, Unit>>;
    loadAllMapGroups(): Promise<Record<string, MapGroup>>;
    loadAllMapItems(): Promise<Record<string, MapItem>>;
    loadAllMapStyles(): Promise<Record<string, MapBaseLayer>>;
    loadAllMapOverlays(): Promise<Record<string, MapOverlay>>;
    loadAllPhotos(): Promise<Record<string, Photo>>;
    loadAllUsers(): Promise<Record<string, User>>;
    loadAllMissionGroups(): Promise<Record<string, MissionGroup>>;

    loadUnit(id: string): Promise<Unit>;
    loadMapGroup(id: string): Promise<MapGroup>;
    loadMapItem(id: string): Promise<MapItem>;
    loadMapStyle(id: string): Promise<MapBaseLayer>;
    loadMapOverlay(id: string): Promise<MapOverlay>;
    loadPhoto(id: string): Promise<Photo>;
    loadUser(id: string): Promise<User>;
    loadMissionGroup(id: string): Promise<MissionGroup>;

    replaceAllUnits(units: Unit[]): Promise<void>;
    replaceAllMapGroups(mapGroups: MapGroup[]): Promise<void>;
    replaceAllMapItems(mapItems: MapItem[]): Promise<void>;
    replaceAllMapStyles(mapStyles: MapBaseLayer[]): Promise<void>;
    replaceAllMapOverlays(mapOverlays: MapOverlay[]): Promise<void>;
    replaceAllPhotos(photos: Photo[]): Promise<void>;
    replaceAllUsers(users: User[]): Promise<void>;
    replaceAllMissionGroups(missionGroups: MissionGroup[]): Promise<void>;

    saveUnit(unit: Unit): Promise<Unit>;
    saveMapGroup(mapGroup: MapGroup): Promise<MapGroup>;
    saveMapItem(mapItem: MapItem): Promise<MapItem>;
    saveMapStyle(mapStyle: MapBaseLayer): Promise<MapBaseLayer>;
    saveMapOverlay(mapOverlay: MapOverlay): Promise<MapOverlay>;
    savePhoto(photo: Photo): Promise<Photo>;
    savePhotoImage(image: File, position: IPosition | null, name: string, missionGroupId: string): Promise<Photo>;
    saveUser(user: User): Promise<User>;
    saveMissionGroup(missionGroup: MissionGroup): Promise<MissionGroup>;

    deleteUnit(id: string): Promise<void>;
    deleteMapGroup(id: string): Promise<void>;
    deleteMapItem(id: string): Promise<void>;
    deleteMapStyle(id: string): Promise<void>;
    deleteMapOverlay(id: string): Promise<void>;
    deletePhoto(id: string): Promise<void>;
    deleteUser(id: string): Promise<void>;
    deleteMissionGroup(id: string): Promise<void>;
}