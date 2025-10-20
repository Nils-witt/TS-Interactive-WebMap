import {openDB} from 'idb';

export interface OverlayDBEntry {
    id: string;
    name: string;
    url: string;
    order: number;
    opacity: number;
    description: string;
}

export interface MapStyleDBEntry {
    id: string;
    name: string;
    url: string;
}

export class DatabaseProvider {
    private static instance: DatabaseProvider;
    private db: IDBDatabase | undefined;

    private constructor() { /* empty */
    }

    private async setUp(): Promise<void> {
        this.db = await openDB('example-database', 5, {
            upgrade(db) {
                console.log("Upgrading database to version 3");
                // Creates an object store:
                if (!db.objectStoreNames.contains('overlays')) {
                    db.createObjectStore('overlays', {keyPath: 'id'});
                }
                if (!db.objectStoreNames.contains('mapStyles')) {
                    db.createObjectStore('mapStyles', {keyPath: 'id'});
                }
            }
        }) as unknown as IDBDatabase;
    }

    public static async getInstance(): Promise<DatabaseProvider> {
        if (!DatabaseProvider.instance) {
            DatabaseProvider.instance = new DatabaseProvider();
            void await DatabaseProvider.instance.setUp();
        }
        return DatabaseProvider.instance;
    }


    public saveOverlay(overlay: OverlayDBEntry): void {
        if (!this.db) return;
        const tx: IDBTransaction = this.db.transaction('overlays', 'readwrite');
        if (tx.objectStore('overlays').getKey(overlay.id)) {
            void tx.objectStore('overlays').put(overlay);
        } else {
            void tx.objectStore('overlays').add(overlay);
        }
    }

    getAllOverlays(): Promise<OverlayDBEntry[]> {
        if (!this.db) return Promise.resolve([]);
        const tx: IDBTransaction = this.db.transaction('overlays', 'readonly');
        return tx.objectStore('overlays').getAll() as unknown as Promise<OverlayDBEntry[]>;
    }

    public saveMapStyle(style: MapStyleDBEntry): void {
        if (!this.db) return;
        const tx: IDBTransaction = this.db.transaction('mapStyles', 'readwrite');
        if (tx.objectStore('mapStyles').getKey(style.id)) {
            void tx.objectStore('mapStyles').put(style);
        } else {
            void tx.objectStore('mapStyles').add(style);
        }
    }

    getAllMapStyles(): Promise<MapStyleDBEntry[]> {
        if (!this.db) return Promise.resolve([]);
        const tx: IDBTransaction = this.db.transaction('mapStyles', 'readonly');
        return tx.objectStore('mapStyles').getAll() as unknown as Promise<MapStyleDBEntry[]>;
    }

}