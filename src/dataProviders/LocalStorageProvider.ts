/*
 * LocalStorageProvider.ts
 * -----------------------
 * Simple local storage backed implementation of StorageInterface for persistence.
 * Exports: LocalStorageProvider default instance
 * Purpose: persist map data locally (map styles, overlays, named objects)
 */

import type {KeyValueInterface} from './KeyValueInterface.ts';


export class LocalStorageProvider implements KeyValueInterface {

    clearAll(): Promise<void> {
        localStorage.clear();
        return Promise.resolve();
    }

    getAllItems(): Promise<Record<string, string>> {

        const items: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; ++i) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) {
                    items[key] = value;
                }
            }
        }
        return Promise.resolve(items);
    }

    getItem(key: string): Promise<string | null> {
        return Promise.resolve(localStorage.getItem(key));
    }

    removeItem(key: string): Promise<void> {
        localStorage.removeItem(key);
        return Promise.resolve();
    }

    setItem(key: string, value: string): Promise<void> {
        localStorage.setItem(key, value);
        return Promise.resolve();
    }


}