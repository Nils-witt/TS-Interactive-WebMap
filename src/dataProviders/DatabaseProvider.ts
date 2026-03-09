/*
 * DatabaseProvider.ts
 * --------------------
 * Provides a local IndexedDB-backed storage with the same API as StorageInterface.
 * Exports: DatabaseProvider singleton that resolves to an instance supporting persistence calls.
 * Purpose: enable local offline persistence and syncing with remote ApiProvider.
 */

import { type IDBPDatabase, openDB } from 'idb';
import type { StorageInterface } from './StorageInterface.ts';
import { MapOverlay } from '../enitities/MapOverlay.ts';
import { MapBaseLayer } from '../enitities/MapBaseLayer.ts';
import { MapItem } from '../enitities/MapItem.ts';
import { MapGroup } from '../enitities/MapGroup.ts';
import { ApplicationLogger } from '../ApplicationLogger.ts';
import { Unit } from '../enitities/Unit.ts';
import type { Photo } from '../enitities/Photo.ts';
import { User } from '../enitities/User.ts';
import { MissionGroup } from '../enitities/MissionGroup.ts';


enum DB_TABLES {
    overlays = 'overlays',
    mapStyles = 'mapStyles',
    mapItems = 'namedgeoreferencedobjects',
    mapGroups = 'mapGroups',
    units = 'units',
    users = 'users',
    missionGroups = 'missionGroups',
}

export class DatabaseProvider implements StorageInterface {
    private static instance: DatabaseProvider;
    private db: IDBPDatabase | undefined;
    private isSetUp = false;
    private listeners = new Map<string, (() => void)[]>();

    private readonly DB_NAME = 'mapDB';

    private constructor() { /* empty */ }

    public async setUp(): Promise<void> {

        const dbVersion = 12;
        this.db = await openDB(this.DB_NAME, dbVersion, {
            upgrade(db) {
                console.log(`Upgrading database to version ${dbVersion}`);
                if (!db.objectStoreNames.contains(DB_TABLES.overlays)) {
                    db.createObjectStore(DB_TABLES.overlays, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(DB_TABLES.mapStyles)) {
                    db.createObjectStore(DB_TABLES.mapStyles, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(DB_TABLES.mapItems)) {
                    db.createObjectStore(DB_TABLES.mapItems, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(DB_TABLES.mapGroups)) {
                    db.createObjectStore(DB_TABLES.mapGroups, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(DB_TABLES.units)) {
                    db.createObjectStore(DB_TABLES.units, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(DB_TABLES.users)) {
                    db.createObjectStore(DB_TABLES.users, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(DB_TABLES.missionGroups)) {
                    db.createObjectStore(DB_TABLES.missionGroups, { keyPath: 'id' });
                }
            }
        });
        this.isSetUp = true;
        ApplicationLogger.info('IndexedDB setup complete.', { service: 'DatabaseProvider' });
    }

    public static async getInstance(): Promise<DatabaseProvider> {
        if (!DatabaseProvider.instance) {
            DatabaseProvider.instance = new DatabaseProvider();
            await DatabaseProvider.instance.setUp();
        }
        if (!DatabaseProvider.instance.isSetUp) {
            await new Promise<void>(resolve => {
                if (!DatabaseProvider.instance.listeners.has('setup')) {
                    DatabaseProvider.instance.listeners.set('setup', []);
                }
                DatabaseProvider.instance.listeners.get('setup')?.push(() => resolve());
            });
        }
        return DatabaseProvider.instance;
    }

    // -- loadAll


    loadAllUnits(): Promise<Record<string, Unit>> {
        return new Promise<Record<string, Unit>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.units, 'readonly');

            void tx.objectStore(DB_TABLES.units).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const units: Record<string, Unit> = {};
                    for (const record of result) {
                        const unit = Unit.of(record);
                        units[unit.getId() as string] = unit;
                    }
                    resolve(units);
                });
        });
    }

    loadAllMapGroups(): Promise<Record<string, MapGroup>> {
        return new Promise<Record<string, MapGroup>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapGroups, 'readonly');

            void tx.objectStore(DB_TABLES.mapGroups).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const mapGroups: Record<string, MapGroup> = {};
                    for (const record of result) {
                        const mapGroup = MapGroup.of(record);
                        mapGroups[mapGroup.getId()] = mapGroup;
                    }
                    resolve(mapGroups);
                });
        });
    }

    loadAllMapItems(): Promise<Record<string, MapItem>> {
        return new Promise<Record<string, MapItem>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapItems, 'readonly');

            void tx.objectStore(DB_TABLES.mapItems).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const namedGeoReferencedObjects: Record<string, MapItem> = {};
                    for (const record of result) {
                        const namedGeoReferencedObject = MapItem.of(record);
                        namedGeoReferencedObjects[namedGeoReferencedObject.getId() as string] = namedGeoReferencedObject;
                    }
                    resolve(namedGeoReferencedObjects);
                });
        });
    }

    loadAllMapStyles(): Promise<Record<string, MapBaseLayer>> {
        return new Promise<Record<string, MapBaseLayer>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapStyles, 'readonly');

            void tx.objectStore(DB_TABLES.mapStyles).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const mapStyles: Record<string, MapBaseLayer> = {};
                    for (const record of result) {
                        const mapStyle = MapBaseLayer.of(record);
                        mapStyles[mapStyle.getId()] = mapStyle;
                        const layerUrl = new URL(mapStyle.getUrl());
                        new BroadcastChannel('setMapServicesBase').postMessage(
                            {
                                url: layerUrl.protocol + '//' + layerUrl.hostname
                            }
                        );
                    }
                    resolve(mapStyles);
                });
        });
    }

    loadAllMapOverlays(): Promise<Record<string, MapOverlay>> {
        return new Promise<Record<string, MapOverlay>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.overlays, 'readonly');

            void tx.objectStore(DB_TABLES.overlays).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const overlays: Record<string, MapOverlay> = {};
                    for (const record of result) {
                        const overlay = MapOverlay.of(record);
                        overlays[overlay.getId()] = overlay;
                    }
                    resolve(overlays);
                });
        });
    }

    loadAllPhotos(): Promise<Record<string, Photo>> {
        return Promise.reject(new Error('Method not implemented.'));
    }

    loadAllMissionGroups(): Promise<Record<string, MissionGroup>> {
        return new Promise<Record<string, MissionGroup>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.missionGroups, 'readonly');

            void tx.objectStore(DB_TABLES.missionGroups).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const missionGroups: Record<string, MissionGroup> = {};
                    for (const record of result) {
                        const missionGroup = MissionGroup.of(record);
                        missionGroups[missionGroup.getId()] = missionGroup;
                    }
                    resolve(missionGroups);
                });
        });
    }

    loadAllUsers(): Promise<Record<string, User>> {
        return new Promise<Record<string, User>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.users, 'readonly');

            void tx.objectStore(DB_TABLES.users).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const overlays: Record<string, User> = {};
                    for (const record of result) {
                        const overlay = User.of(record);
                        overlays[overlay.getId()] = overlay;
                    }
                    resolve(overlays);
                });
        });
    }

    // -- load single

    loadUnit(id: string): Promise<Unit> {
        return new Promise<Unit>((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.units, 'readonly');

            void tx.objectStore(DB_TABLES.units).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    const unit = Unit.of(result);
                    resolve(unit);
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    loadMapGroup(id: string): Promise<MapGroup> {
        return new Promise<MapGroup>((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.mapGroups, 'readonly');

            void tx.objectStore(DB_TABLES.mapGroups).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    const mapGroup = MapGroup.of(result);
                    resolve(mapGroup);
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    loadMapItem(id: string): Promise<MapItem> {
        return new Promise<MapItem>((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.mapItems, 'readonly');

            void tx.objectStore(DB_TABLES.mapItems).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    const namedGeoReferencedObject = MapItem.of(result);
                    resolve(namedGeoReferencedObject);
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    loadMapStyle(id: string): Promise<MapBaseLayer> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.mapStyles, 'readonly');

            void tx.objectStore(DB_TABLES.mapStyles).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    const mapStyle = MapBaseLayer.of(result);
                    resolve(mapStyle);
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    loadMapOverlay(id: string): Promise<MapOverlay> {
        return new Promise<MapOverlay>((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.overlays, 'readonly');

            void tx.objectStore(DB_TABLES.overlays).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    const overlay = MapOverlay.of(result);
                    return resolve(overlay);
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    loadPhoto(id: string): Promise<Photo> {
        return Promise.reject(new Error(`Method not implemented. loadPhoto(${id}`));
    }

    loadMissionGroup(id: string): Promise<MissionGroup> {
        return new Promise<MissionGroup>((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.missionGroups, 'readonly');

            void tx.objectStore(DB_TABLES.missionGroups).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    return resolve(MissionGroup.of(result));
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    loadUser(id: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.users, 'readonly');

            void tx.objectStore(DB_TABLES.users).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    return resolve(User.of(result));
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    // -- replace all



    replaceAllUnits(units: Unit[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.units, 'readwrite');
            void tx.objectStore(DB_TABLES.units).getAllKeys().then(result => {
                const existingKeys = result as string[];
                const newKeys = units.map(entry => entry.getId());

                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.units).delete(existingKey);
                    }
                }

                for (const unit of units) {
                    const unitRecord = unit.record();
                    if (existingKeys.includes(unit.getId() as string)) {
                        void tx.objectStore(DB_TABLES.units).put(unitRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.units).add(unitRecord);
                    }
                }
                resolve();
            });
        });
    }

    replaceAllMapGroups(mapGroups: MapGroup[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapGroups, 'readwrite');
            void tx.objectStore(DB_TABLES.mapGroups).getAllKeys().then(result => {
                const existingKeys = result as string[];
                const newKeys = mapGroups.map(entry => entry.getId());

                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.mapGroups).delete(existingKey);
                    }
                }

                for (const mapGroup of mapGroups) {
                    const mapGroupRecord = mapGroup.record();
                    if (existingKeys.includes(mapGroup.getId())) {
                        void tx.objectStore(DB_TABLES.mapGroups).put(mapGroupRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.mapGroups).add(mapGroupRecord);
                    }
                }
                resolve();
            });
        });
    }

    replaceAllMapItems(namedGeoReferencedObjects: MapItem[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapItems, 'readwrite');
            void tx.objectStore(DB_TABLES.mapItems).getAllKeys().then(result => {
                const existingKeys = result as string[];
                const newKeys = namedGeoReferencedObjects.map(entry => entry.getId());

                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.mapItems).delete(existingKey);
                    }
                }

                for (const namedGeoReferencedObject of namedGeoReferencedObjects) {
                    const namedGeoReferencedObjectRecord = namedGeoReferencedObject.record();
                    if (namedGeoReferencedObject.getId() == null) continue;
                    if (existingKeys.includes((namedGeoReferencedObject.getId() as string))) {
                        void tx.objectStore(DB_TABLES.mapItems).put(namedGeoReferencedObjectRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.mapItems).add(namedGeoReferencedObjectRecord);
                    }
                }
                resolve();
            });
        });
    }


    replaceAllMapStyles(mapStyles: MapBaseLayer[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapStyles, 'readwrite');
            void tx.objectStore(DB_TABLES.mapStyles).getAllKeys().then(result => {
                const existingKeys = result as string[];
                const newKeys = mapStyles.map(ms => ms.getId());

                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.mapStyles).delete(existingKey);
                    }
                }

                for (const mapStyle of mapStyles) {
                    const mapStyleRecord = mapStyle.record();
                    if (existingKeys.includes(mapStyle.getId())) {
                        void tx.objectStore(DB_TABLES.mapStyles).put(mapStyleRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.mapStyles).add(mapStyleRecord);
                    }
                }
                resolve();
            });
        });
    }

    replaceAllMapOverlays(overlays: MapOverlay[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.overlays, 'readwrite');
            void tx.objectStore(DB_TABLES.overlays).getAllKeys().then(result => {
                const existingKeys = result as string[];
                const newKeys = overlays.map(entry => entry.getId());

                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.overlays).delete(existingKey);
                    }
                }

                for (const overlay of overlays) {
                    const overlayRecord = overlay.record();
                    if (existingKeys.includes(overlay.getId())) {
                        void tx.objectStore(DB_TABLES.overlays).put(overlayRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.overlays).add(overlayRecord);
                    }
                }
                resolve();
            });
        });
    }

    replaceAllPhotos(photos: Photo[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. replaceAllPhotos(${photos.length} photos)`));
    }

    replaceAllMissionGroups(missionGroups: MissionGroup[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.missionGroups, 'readwrite');
            void tx.objectStore(DB_TABLES.missionGroups).getAllKeys().then(result => {
                const existingKeys = result as string[];
                const newKeys = missionGroups.map(entry => entry.getId());

                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.missionGroups).delete(existingKey);
                    }
                }

                for (const missionGroup of missionGroups) {
                    const missionGroupRecord = missionGroup.record();
                    if (existingKeys.includes(missionGroup.getId())) {
                        void tx.objectStore(DB_TABLES.missionGroups).put(missionGroupRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.missionGroups).add(missionGroupRecord);
                    }
                }
                resolve();
            });
        });
    }

    replaceAllUsers(users: User[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.users, 'readwrite');
            void tx.objectStore(DB_TABLES.users).getAllKeys().then(result => {
                const existingKeys = result as string[];
                const newKeys = users.map(entry => entry.getId());

                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.users).delete(existingKey);
                    }
                }

                for (const user of users) {
                    const userRecord = user.record();
                    if (existingKeys.includes(user.getId())) {
                        void tx.objectStore(DB_TABLES.users).put(userRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.users).add(userRecord);
                    }
                }
                resolve();
            });
        });
    }

    // -- save single

    saveUnit(unit: Unit): Promise<Unit> {
        return new Promise<Unit>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            if (unit.getId() == null) throw new Error('No ID set for unit');
            const unitRecord = unit.record();
            const tx = this.db.transaction(DB_TABLES.units, 'readwrite');

            void tx.objectStore(DB_TABLES.units).getKey(unit.getId() as string).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.units).put(unitRecord);
                } else {
                    void tx.objectStore(DB_TABLES.units).add(unitRecord);
                }
                resolve(unit);
            });
        });
    }

    saveMapGroup(mapGroup: MapGroup): Promise<MapGroup> {
        return new Promise<MapGroup>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const mapGroupRecord = mapGroup.record();
            const tx = this.db.transaction(DB_TABLES.mapGroups, 'readwrite');

            void tx.objectStore(DB_TABLES.mapGroups).getKey(mapGroup.getId()).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.mapGroups).put(mapGroupRecord);
                } else {
                    void tx.objectStore(DB_TABLES.mapGroups).add(mapGroupRecord);
                }
                resolve(mapGroup);
            });
        });
    }

    saveMapItem(namedGeoReferencedObject: MapItem): Promise<MapItem> {
        return new Promise<MapItem>((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const namedGeoReferencedObjectRecord = namedGeoReferencedObject.record();
            const tx = this.db.transaction(DB_TABLES.mapItems, 'readwrite');

            if (namedGeoReferencedObject.getId() == null) {
                return reject(new Error('NamedGeoReferencedObject ID is null'));
            }
            void tx.objectStore(DB_TABLES.mapItems).getKey(namedGeoReferencedObject.getId() as string).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.mapItems).put(namedGeoReferencedObjectRecord);
                } else {
                    void tx.objectStore(DB_TABLES.mapItems).add(namedGeoReferencedObjectRecord);
                }
                resolve(namedGeoReferencedObject);
            });
        });
    }


    saveMapStyle(mapStyle: MapBaseLayer): Promise<MapBaseLayer> {
        return new Promise<MapBaseLayer>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const mapStyleRecord = mapStyle.record();
            const tx = this.db.transaction(DB_TABLES.mapStyles, 'readwrite');

            void tx.objectStore(DB_TABLES.mapStyles).getKey(mapStyle.getId()).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.mapStyles).put(mapStyleRecord);
                } else {
                    void tx.objectStore(DB_TABLES.mapStyles).add(mapStyleRecord);
                }
                resolve(mapStyle);
            });
        });
    }

    saveMapOverlay(overlay: MapOverlay): Promise<MapOverlay> {
        return new Promise((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const overlayRecord = overlay.record();
            const tx = this.db.transaction(DB_TABLES.overlays, 'readwrite');

            void tx.objectStore(DB_TABLES.overlays).getKey(overlay.getId()).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.overlays).put(overlayRecord);
                } else {
                    void tx.objectStore(DB_TABLES.overlays).add(overlayRecord);
                }
                resolve(overlay);
            });
        });
    }

    savePhoto(photo: Photo): Promise<Photo> {
        return Promise.reject(new Error(`Method not implemented. savePhoto(${photo.id})`));
    }

    savePhotoImage(image: File): Promise<Photo> {
        return Promise.reject(new Error(`Method not implemented. savePhotoImage(${image.name})`));
    }

    saveMissionGroup(missionGroup: MissionGroup): Promise<MissionGroup> {
        return new Promise<MissionGroup>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const missionGroupRecord = missionGroup.record();
            const tx = this.db.transaction(DB_TABLES.missionGroups, 'readwrite');

            void tx.objectStore(DB_TABLES.missionGroups).getKey(missionGroup.getId()).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.missionGroups).put(missionGroupRecord);
                } else {
                    void tx.objectStore(DB_TABLES.missionGroups).add(missionGroupRecord);
                }
                resolve(missionGroup);
            });
        });
    }

    saveUser(user: User): Promise<User> {
        return new Promise((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const userRecord = user.record();
            const tx = this.db.transaction(DB_TABLES.users, 'readwrite');

            void tx.objectStore(DB_TABLES.users).getKey(user.getId()).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.users).put(userRecord);
                } else {
                    void tx.objectStore(DB_TABLES.users).add(userRecord);
                }
                resolve(user);
            });
        });
    }

    // -- delete single

    deleteUnit(id: string): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.units, 'readwrite');

            void tx.objectStore(DB_TABLES.units).getKey(id).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.units).delete(id);
                    resolve();
                } else {
                    throw new Error('Not Exist');
                }
            });
        });
    }

    deleteMapGroup(id: string): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.mapGroups, 'readwrite');

            void tx.objectStore(DB_TABLES.mapGroups).getKey(id).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.mapGroups).delete(id);
                    resolve();
                } else {
                    throw new Error('Not Exist');
                }
            });
        });
    }

    deleteMapItem(id: string): Promise<void> {

        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapItems, 'readwrite');

            void tx.objectStore(DB_TABLES.mapItems).getKey(id).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.mapItems).delete(id);
                    return resolve();
                } else {
                    return reject(new Error('Not Exist'));
                }
            });
        });
    }

    deleteMapStyle(id: string): Promise<void> {
        return new Promise((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapStyles, 'readwrite');
            void tx.objectStore(DB_TABLES.mapStyles).getKey(id).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.mapStyles).delete(id);
                    resolve();
                } else {
                    throw new Error('Not Exist');
                }
            });
        });
    }

    deleteMapOverlay(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.overlays, 'readwrite');

            void tx.objectStore(DB_TABLES.overlays).getKey(id).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.overlays).delete(id);
                    resolve();
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    deletePhoto(id: string): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. deletePhoto(${id})`));
    }

    deleteMissionGroup(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.missionGroups, 'readwrite');

            void tx.objectStore(DB_TABLES.missionGroups).getKey(id).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.missionGroups).delete(id);
                    resolve();
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    deleteUser(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.users, 'readwrite');

            void tx.objectStore(DB_TABLES.users).getKey(id).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.users).delete(id);
                    resolve();
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

}