/*
 * DatabaseProvider.ts
 * --------------------
 * Provides a local IndexedDB-backed storage with the same API as StorageInterface.
 * Exports: DatabaseProvider singleton that resolves to an instance supporting persistence calls.
 * Purpose: enable local offline persistence and syncing with remote ApiProvider.
 */

import {type IDBPDatabase, openDB} from 'idb';
import type {StorageInterface} from './StorageInterface.ts';
import {Overlay} from '../enitities/Overlay.ts';
import {MapStyle} from '../enitities/MapStyle.ts';
import {NamedGeoReferencedObject} from '../enitities/NamedGeoReferencedObject.ts';
import {MapGroup} from '../enitities/MapGroup.ts';


enum DB_TABLES {
    overlays = 'overlays',
    mapStyles = 'mapStyles',
    namedGeoReferencedObjects = 'namedgeoreferencedobjects',
    mapGroups = 'mapGroups',
}

export class DatabaseProvider implements StorageInterface {
    private static instance: DatabaseProvider;
    private db: IDBPDatabase | undefined;

    private readonly DB_NAME = 'mapDB';

    private constructor() { /* empty */
    }

    public async setUp(): Promise<void> {

        const dbVersion = 9;
        this.db = await openDB(this.DB_NAME, dbVersion, {
            upgrade(db) {
                console.log(`Upgrading database to version ${dbVersion}`);
                if (!db.objectStoreNames.contains(DB_TABLES.overlays)) {
                    db.createObjectStore(DB_TABLES.overlays, {keyPath: 'id'});
                }
                if (!db.objectStoreNames.contains(DB_TABLES.mapStyles)) {
                    db.createObjectStore(DB_TABLES.mapStyles, {keyPath: 'id'});
                }

                if (!db.objectStoreNames.contains(DB_TABLES.namedGeoReferencedObjects)) {
                    db.createObjectStore(DB_TABLES.namedGeoReferencedObjects, {keyPath: 'id'});
                }
                if (!db.objectStoreNames.contains(DB_TABLES.mapGroups)) {
                    db.createObjectStore(DB_TABLES.mapGroups, {keyPath: 'id'});
                }
            }
        }) as unknown as IDBPDatabase;
    }

    public static async getInstance(): Promise<DatabaseProvider> {
        if (!DatabaseProvider.instance) {
            DatabaseProvider.instance = new DatabaseProvider();
            void await DatabaseProvider.instance.setUp();
        }
        return DatabaseProvider.instance;
    }

    saveOverlay(overlay: Overlay): Promise<Overlay> {

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

    deleteNamedGeoReferencedObject(id: string): Promise<void> {

        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.namedGeoReferencedObjects, 'readwrite');

            void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).getKey(id).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).delete(id);
                    return resolve();
                } else {
                    return reject(new Error('Not Exist'));
                }
            });
        });
    }

    deleteOverlay(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.overlays, 'readwrite');

            void tx.objectStore(DB_TABLES.overlays).getKey(id).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.overlays).delete(id);
                    resolve(true);
                } else {
                    reject(new Error('Not Exist'));
                }
            });
        });
    }

    loadAllMapStyles(): Promise<Record<string, MapStyle>> {
        return new Promise<Record<string, MapStyle>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapStyles, 'readonly');

            void tx.objectStore(DB_TABLES.mapStyles).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const mapStyles: Record<string, MapStyle> = {};
                    for (const record of result) {
                        const mapStyle = MapStyle.of(record);
                        mapStyles[mapStyle.getID()] = mapStyle;
                    }
                    resolve(mapStyles);
                });
        });
    }

    loadAllNamedGeoReferencedObjects(): Promise<Record<string, NamedGeoReferencedObject>> {
        return new Promise<Record<string, NamedGeoReferencedObject>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.namedGeoReferencedObjects, 'readonly');

            void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const namedGeoReferencedObjects: Record<string, NamedGeoReferencedObject> = {};
                    for (const record of result) {
                        const namedGeoReferencedObject = NamedGeoReferencedObject.of(record);
                        namedGeoReferencedObjects[namedGeoReferencedObject.getId()] = namedGeoReferencedObject;
                    }
                    resolve(namedGeoReferencedObjects);
                });
        });
    }

    loadAllOverlays(): Promise<Record<string, Overlay>> {
        return new Promise<Record<string, Overlay>>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.overlays, 'readonly');

            void tx.objectStore(DB_TABLES.overlays).getAll()
                .then((result: Record<string, string | number>[]) => {
                    const overlays: Record<string, Overlay> = {};
                    for (const record of result) {
                        const overlay = Overlay.of(record);
                        overlays[overlay.getId()] = overlay;
                    }
                    resolve(overlays);
                });
        });
    }

    loadMapStyle(id: string): Promise<MapStyle | null> {
        return new Promise((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.mapStyles, 'readonly');

            void tx.objectStore(DB_TABLES.mapStyles).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    const mapStyle = MapStyle.of(result);
                    resolve(mapStyle);
                } else {
                    resolve(null);
                }
            });
        });
    }

    loadNamedGeoReferencedObject(id: string): Promise<NamedGeoReferencedObject | null> {
        return new Promise<NamedGeoReferencedObject | null>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.namedGeoReferencedObjects, 'readonly');

            void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    const namedGeoReferencedObject = NamedGeoReferencedObject.of(result);
                    resolve(namedGeoReferencedObject);
                } else {
                    resolve(null);
                }
            });
        });
    }

    loadOverlay(id: string): Promise<Overlay | null> {
        return new Promise<Overlay | null>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.overlays, 'readonly');

            void tx.objectStore(DB_TABLES.overlays).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    const overlay = Overlay.of(result);
                    resolve(overlay);
                } else {
                    resolve(null);
                }
            });
        });
    }

    saveMapStyle(mapStyle: MapStyle): Promise<MapStyle> {
        return new Promise<MapStyle>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const mapStyleRecord = mapStyle.record();
            const tx = this.db.transaction(DB_TABLES.mapStyles, 'readwrite');

            void tx.objectStore(DB_TABLES.mapStyles).getKey(mapStyle.getID()).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.mapStyles).put(mapStyleRecord);
                } else {
                    void tx.objectStore(DB_TABLES.mapStyles).add(mapStyleRecord);
                }
                resolve(mapStyle);
            });
        });
    }

    saveNamedGeoReferencedObject(namedGeoReferencedObject: NamedGeoReferencedObject): Promise<NamedGeoReferencedObject> {
        return new Promise<NamedGeoReferencedObject>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const namedGeoReferencedObjectRecord = namedGeoReferencedObject.record();
            const tx = this.db.transaction(DB_TABLES.namedGeoReferencedObjects, 'readwrite');

            void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).getKey(namedGeoReferencedObject.getId()).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).put(namedGeoReferencedObjectRecord);
                } else {
                    void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).add(namedGeoReferencedObjectRecord);
                }
                resolve(namedGeoReferencedObject);
            });
        });
    }

    replaceMapStyles(mapStyles: MapStyle[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapStyles, 'readwrite');
            void tx.objectStore(DB_TABLES.mapStyles).getAllKeys().then(result => {
                const existingKeys = result as string[];

                const newKeys = mapStyles.map(ms => ms.getID());


                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.mapStyles).delete(existingKey);
                    }
                }

                for (const mapStyle of mapStyles) {
                    const mapStyleRecord = mapStyle.record();
                    if (existingKeys.includes(mapStyle.getID())) {
                        void tx.objectStore(DB_TABLES.mapStyles).put(mapStyleRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.mapStyles).add(mapStyleRecord);
                    }
                }
                resolve();
            });
        });
    }

    replaceOverlays(overlays: Overlay[]): Promise<void> {
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

    replaceNamedGeoReferencedObjects(namedGeoReferencedObjects: NamedGeoReferencedObject[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.namedGeoReferencedObjects, 'readwrite');
            void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).getAllKeys().then(result => {
                const existingKeys = result as string[];
                const newKeys = namedGeoReferencedObjects.map(entry => entry.getId());

                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).delete(existingKey);
                    }
                }

                for (const namedGeoReferencedObject of namedGeoReferencedObjects) {
                    const namedGeoReferencedObjectRecord = namedGeoReferencedObject.record();
                    if (existingKeys.includes(namedGeoReferencedObject.getId())) {
                        void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).put(namedGeoReferencedObjectRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.namedGeoReferencedObjects).add(namedGeoReferencedObjectRecord);
                    }
                }
                resolve();
            });
        });
    }

    loadMapGroup(id: string): Promise<MapGroup | null> {
        return new Promise<MapGroup | null>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const tx = this.db.transaction(DB_TABLES.mapGroups, 'readonly');

            void tx.objectStore(DB_TABLES.mapGroups).get(id).then((result: Record<string, string | number> | undefined) => {
                if (result) {
                    const mapGroup = MapGroup.of(result);
                    resolve(mapGroup);
                } else {
                    resolve(null);
                }
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
                        mapGroups[mapGroup.getID()] = mapGroup;
                    }
                    resolve(mapGroups);
                });
        });
    }

    saveMapGroup(mapGroup: MapGroup): Promise<MapGroup> {
        return new Promise<MapGroup>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');

            const mapGroupRecord = mapGroup.record();
            const tx = this.db.transaction(DB_TABLES.mapGroups, 'readwrite');

            void tx.objectStore(DB_TABLES.mapGroups).getKey(mapGroup.getID()).then(result => {
                if (result) {
                    void tx.objectStore(DB_TABLES.mapGroups).put(mapGroupRecord);
                } else {
                    void tx.objectStore(DB_TABLES.mapGroups).add(mapGroupRecord);
                }
                resolve(mapGroup);
            });
        });
    }

    replaceMapGroups(mapGroups: MapGroup[]): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.db) throw new Error('Database not initialized');
            const tx = this.db.transaction(DB_TABLES.mapGroups, 'readwrite');
            void tx.objectStore(DB_TABLES.mapGroups).getAllKeys().then(result => {
                const existingKeys = result as string[];
                const newKeys = mapGroups.map(entry => entry.getID());

                for (const existingKey of existingKeys) {
                    if (!newKeys.includes(existingKey)) {
                        void tx.objectStore(DB_TABLES.mapGroups).delete(existingKey);
                    }
                }

                for (const mapGroup of mapGroups) {
                    const mapGroupRecord = mapGroup.record();
                    if (existingKeys.includes(mapGroup.getID())) {
                        void tx.objectStore(DB_TABLES.mapGroups).put(mapGroupRecord);
                    } else {
                        void tx.objectStore(DB_TABLES.mapGroups).add(mapGroupRecord);
                    }
                }
                resolve();
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
}