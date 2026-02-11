import {ApiProvider} from './ApiProvider.ts';
import {DataProvider} from './DataProvider.ts';
import {Utilities} from '../Utilities.ts';
import type {MapOverlay} from '../enitities/MapOverlay.ts';
import type {MapBaseLayer} from '../enitities/MapBaseLayer.ts';

class CacheProvider {
    private static instance: CacheProvider | null = null;

    private constructor() { /* empty */
    }

    public static getInstance(): CacheProvider {
        if (!this.instance) {
            this.instance = new CacheProvider();
        }
        return this.instance;
    }

    /**
     * Gets a list of all cached overlay IDs.
     */
    async getCachedOverlayList(): Promise<string[]> {
        const cacheNames = await caches.keys();
        return cacheNames.filter(c => c.startsWith('overlay-'));
    }


    /**
     * Gets the cache state for a given overlay, including remote tiles, cached tiles, and missing tiles.
     * @param overlay
     */
    async getOverlayCacheState(overlay: MapOverlay): Promise<{
        remoteTiles: string[],
        cachedTiles: string[],
        missing: string[]
    }> {
        const cache = await caches.open(`overlay-${overlay.getId()}_${overlay.getLayerVersion()}`);
        const localTiles = Array.from(await cache.keys()).map(rq => rq.url);
        const remoteTiles = await ApiProvider.getInstance().getOverlayTiles(overlay);

        const missingTiles = remoteTiles.filter(rt => !localTiles.includes(rt));
        return {
            remoteTiles: remoteTiles,
            cachedTiles: localTiles,
            missing: missingTiles
        };
    }

    /**
     * Caches a single tile given its URL and the cache to store it in.
     * @param tileUrl
     * @param cache
     * @private
     */
    private async cacheTile(tileUrl: string, cache: Cache): Promise<void> {
        const response = await fetch(tileUrl + '?accesstoken=' + DataProvider.getInstance().getApiToken());
        void await cache.put(tileUrl, response);
    }

    /**
     * Caches all vector tiles for the given vector layer and tiles.
     * @param vectorLayer
     * @param tiles
     */
    async cacheVector(vectorLayer: MapBaseLayer, tiles: { x: number, y: number, z: number }[]): Promise<void> {
        const cache = await caches.open('vector-cache');

        const style = await fetch(vectorLayer.getUrl());
        const styleJson = await style.json() as { sources: Record<string, { type: string, url: string }> };

        const urls: string[] = [];


        for (const sourceKey of Object.keys(styleJson.sources)) {
            const source = styleJson.sources[sourceKey] as { type: string, url: string };

            const sourceRes = await fetch(source.url);
            const sourceJson = await sourceRes.json() as { tiles: string[] };

            for (const tile of tiles) {
                for (const tileUrlTemplate of sourceJson.tiles) {
                    const tileUrl = tileUrlTemplate.replace('{x}', tile.x.toString()).replace('{y}', tile.y.toString()).replace('{z}', tile.z.toString());
                    urls.push(tileUrl);
                }
            }

        }

        for (let i = 0; i < urls.length; i = i + 10) {
            await Promise.all([
                ...urls.slice(i, i + 10).map(tileUrl => this.cacheTile(tileUrl, cache))
            ]);
        }

    }

    /**
     * Caches all tiles for the given overlay.
     * @param overlay
     * @param btn
     */
    async cacheOverlay(overlay: MapOverlay, btn?: HTMLButtonElement): Promise<void> {
        const state = await this.getOverlayCacheState(overlay);
        const cache = await caches.open(`overlay-${overlay.getId()}_${overlay.getLayerVersion()}`);
        const tmpCache = await caches.open('overlay-tmp');

        for (let i = 0; i < state.missing.length; i = i + 10) {

            await Promise.all([
                ...state.missing.slice(i, i + 10).map(tileUrl => this.cacheTile(tileUrl, cache))
            ]);
            if (btn) {
                btn.innerText = `Downloading... (${state.missing.length - i} / ${state.missing.length})`;
            }
        }

        for (const tile of await cache.keys()) {
            await tmpCache.delete(tile.url);
        }
        if (btn) {
            btn.innerText = 'complete!';
        }

    }


    /**
     * Caches vector background tiles for all overlays currently cached.
     */
    async cacheVectorForOverlays(): Promise<void> {
        const overlays = Array.from(DataProvider.getInstance().getOverlays().values());
        const vectorMaxZoom = 14;

        const pendingTiles: Record<number, Record<number, number[]>> = {};

        for (const overlay of overlays) {
            const cache = await caches.open(`overlay-${overlay.getId()}_${overlay.getLayerVersion()}`);
            for (const tile of await cache.keys()) {

                const {x, y, z} = Utilities.splitTileUrl(tile.url);
                if (z <= vectorMaxZoom) {
                    if (pendingTiles[z] === undefined) {
                        pendingTiles[z] = {};
                    }
                    if (pendingTiles[z][x] === undefined) {
                        pendingTiles[z][x] = [];
                    }
                    if (!pendingTiles[z][x].includes(y)) {
                        pendingTiles[z][x].push(y);
                    }
                }
            }
        }
        const tilesToCache: { x: number, y: number, z: number }[] = [];

        for (const z of Object.keys(pendingTiles).map(k => parseInt(k, 10))) {
            for (const x of Object.keys(pendingTiles[z]).map(k => parseInt(k, 10))) {
                for (const y of pendingTiles[z][x]) {
                    tilesToCache.push({x: x, y: y, z: z});
                }
            }
        }
        const mapStyle = DataProvider.getInstance().getMapStyle();
        if (mapStyle != undefined) {
            await this.cacheVector(mapStyle, tilesToCache);
        }
    }
}

export default CacheProvider;