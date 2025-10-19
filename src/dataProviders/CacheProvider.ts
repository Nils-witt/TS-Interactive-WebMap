import {ApiProvider} from "./ApiProvider.ts";
import type {LayerInfo} from "../types/LayerInfo.ts";
import {DataProvider} from "./DataProvider.ts";
import {Utilities} from "../Utilities.ts";

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

    async cacheLayer(overlay: LayerInfo, btn?: HTMLButtonElement): Promise<void> {
        const state = await this.getOverlayCacheState(overlay);
        const cache = await caches.open(`overlay-${overlay.getId()}`);
        const tmpCache = await caches.open(`overlay-tmp`);
        let i = 0
        for (const tileUrl of state.missing) {
            if(await tmpCache.match(tileUrl)){
                await tmpCache.delete(tileUrl);
            }
            const response = await fetch(tileUrl + '?accesstoken=' + DataProvider.getInstance().getApiToken());
            void await cache.put(tileUrl, response);
            i++;

            void await Utilities.sleep(100);
            if(btn){
                btn.innerText = `Downloading... (${state.missing.length - i} / ${state.missing.length})`;
            }
        }
        if (btn){
            btn.innerText = `complete!`;
        }
    }
}