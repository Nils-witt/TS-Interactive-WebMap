import {ApiProvider} from "./ApiProvider.ts";
import type {LayerInfo} from "../types/LayerInfo.ts";
import {DataProvider} from "./DataProvider.ts";

export class CacheProvider {
    private static instance: CacheProvider | null = null;

    private constructor() { /* empty */
    }

    public static getInstance(): CacheProvider {
        if (!this.instance) {
            this.instance = new CacheProvider();
        }
        return this.instance;
    }


    async getCachedOverlayList(): Promise<string[]> {
        const cacheNames = await caches.keys()
        return cacheNames.filter(c => c.startsWith("overlay-"))
    }


    async getOverlayCacheState(overlay: LayerInfo): Promise<{
        remoteTiles: string[],
        cachedTiles: string[],
        missing: string[]
    }> {
        const cache = await caches.open(`overlay-${overlay.getId()}`);
        const localTiles = Array.from(await cache.keys()).map(rq => rq.url);
        const remoteTiles = await ApiProvider.getInstance().getOverlayTiles(overlay);

        const missingTiles = remoteTiles.filter(rt => !localTiles.includes(rt));
        return {
            remoteTiles: remoteTiles,
            cachedTiles: localTiles,
            missing: missingTiles
        }
    }

    private async cacheTile(tileUrl: string, cache: Cache): Promise<void> {
        const response = await fetch(tileUrl + '?accesstoken=' + DataProvider.getInstance().getApiToken());
        void await cache.put(tileUrl, response);
    }

    async cacheLayer(overlay: LayerInfo, btn?: HTMLButtonElement): Promise<void> {
        const state = await this.getOverlayCacheState(overlay);
        const cache = await caches.open(`overlay-${overlay.getId()}`);
        const tmpCache = await caches.open(`overlay-tmp`);

        for (let i = 0; i < state.missing.length; i = i + 10) {

            await Promise.all([
                ...state.missing.slice(i, i + 10).map(tileUrl => this.cacheTile(tileUrl, cache))
            ])
            if (btn) {
                btn.innerText = `Downloading... (${state.missing.length - i} / ${state.missing.length})`;
            }
        }

        for (const tile of await cache.keys()) {
            await tmpCache.delete(tile.url);
        }
        if (btn) {
            btn.innerText = `complete!`;
        }

    }
}