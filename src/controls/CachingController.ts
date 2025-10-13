import {LayerInfo} from "../types/LayerInfo";
import {DataProvider} from "../dataProviders/DataProvider";

export type LayerCachingStatus = 'cached' | 'notCached' | 'partly' | 'loading' | 'error';

export class LayerCachingController {

    private static instance: LayerCachingController | null = null;

    private constructor() {

    }

    public static getInstance(): LayerCachingController {
        if (!this.instance) {
            this.instance = new LayerCachingController();

        }
        return this.instance;
    }


    public getLayerCachedTiles(layer: LayerInfo) : Promise<string[]>{
        return new Promise((resolve) => {
            let url: URL | undefined;
            if (layer.getUrl().startsWith('http')) {
                url = new URL(layer.getUrl().substring(0, layer.getUrl().search("{z}"))); // Ensure the URL is absolute
            } else {
                url = new URL(layer.getUrl().substring(0, layer.getUrl().search("{z}")), window.location.origin); // Ensure the URL is absolute
            }


            const path = url.pathname.replace('/overlays/', '');
            const parts = path.split('/');
            const cacheName = 'overlay-' + parts[0]; // Use the first part of the path as the cache name

            caches.open(cacheName).then((cache) => {
                cache.keys().then((keys) => {
                    console.log("Cache keys for", cacheName, ":", keys);
                    resolve(keys.map(key => key.url));
                }).catch(error => {
                    console.error("Failed to get cache keys:", error);
                });
            });
        });
    }

    public getOnlineLayerTiles(layer: LayerInfo): Promise<string[]> {
        return new Promise((resolve) => {
            let url: URL | undefined;
            if (layer.getUrl().startsWith('http')) {
                url = new URL(layer.getUrl().substring(0, layer.getUrl().search("{z}"))); // Ensure the URL is absolute
            } else {
                url = new URL(layer.getUrl().substring(0, layer.getUrl().search("{z}")), window.location.origin); // Ensure the URL is absolute
            }

            fetch(url.href + "/index.json?accesstoken=" + DataProvider.getInstance().getApiToken()).then(async response => {
                if (!response.ok) {
                    return;
                }

                const filelist = []
                const data = await response.json()

                const zVals = Object.keys(data);
                for (let i = 0; i < zVals.length; i++) {
                    const z = zVals[i];
                    const xVals = Object.keys(data[z]);
                    for (let j = 0; j < xVals.length; j++) {
                        const x = xVals[j];
                        const yVals = Object.keys(data[z][x]);

                        for (let k = 0; k < yVals.length; k++) {
                            const y = data[z][x][k];
                            const tileUrl = `${url.href}${z}/${x}/${y}`;
                            filelist.push(tileUrl);
                        }
                    }

                }
                resolve(filelist);
            }).catch(error => {
                console.error("Failed to fetch index.json:", error);
                resolve([]);
            });
        });
    }


    public getMissingCacheFiles(layer: LayerInfo): Promise<string[]> {
        return new Promise((resolve) => {
            const missingFiles: string[] = [];

            this.getOnlineLayerTiles(layer).then((remoteFiles) => {
                this.getLayerCachedTiles(layer).then((cacheFiles) => {
                    console.log("Remote files:", remoteFiles);
                    console.log("Cache files:", cacheFiles);

                    // Check for missing files
                    remoteFiles.forEach((file) => {
                        if (!cacheFiles.includes(file)) {
                            missingFiles.push(file);
                        }
                    });

                    console.log("Missing files:", missingFiles);
                    resolve(missingFiles);
                }).catch(error => {
                    console.error("Error getting cache layer tiles:", error);
                    resolve([]); // Return empty array on error
                });
            }).catch(error => {
                console.error("Error getting remote layer tiles:", error);
                resolve([]); // Return empty array on error
            });

        });
    }

    public downloadLayerToCache(layer: LayerInfo, button: HTMLButtonElement): Promise<boolean> {

        return new Promise<boolean>((resolve) => {
            let url: URL | undefined;
            if (layer.getUrl().startsWith('http')) {
                url = new URL(layer.getUrl().substring(0, layer.getUrl().search("{z}"))); // Ensure the URL is absolute
            } else {
                url = new URL(layer.getUrl().substring(0, layer.getUrl().search("{z}")), window.location.origin); // Ensure the URL is absolute
            }


            const path = url.pathname.replace('/overlays/', '');
            const parts = path.split('/');
            const cacheName = 'overlay-' + parts[0]; // Use the first part of the path as the cache name

            this.getMissingCacheFiles(layer).then((missingFiles) => {


                let missingCount = missingFiles.length;

                const bntInterval = setInterval(() => {
                    button.innerText = `Downloading Layer ${missingCount}tiles`;
                }, 1000);

                caches.open(cacheName).then(async (cache) => {
                    for (let i = 0; i < missingFiles.length; i++) {
                        await new Promise<void>((resolve, reject) => {

                            fetch(missingFiles[i] + "?accesstoken=" + DataProvider.getInstance().getApiToken()).then(response => {
                                if (!response.ok) {
                                    console.error("Failed to fetch layer file:", missingFiles[i], "Status:", response.status);
                                    reject(false);
                                    return;
                                }
                                cache.put(missingFiles[i], response.clone()).then(() => {
                                    resolve();
                                }).catch(error => {
                                    console.error("Failed to cache layer file:", missingFiles[i], error);
                                    reject(false);
                                    return;
                                });

                            }).catch(error => {
                                console.error("Error fetching layer file:", missingFiles[i], error);
                                reject(false);
                                return;
                            });
                        });
                        missingCount = missingFiles.length - i;
                        await new Promise(resolve => setTimeout(resolve, 50)); // Add a delay to avoid overwhelming the cache
                    }
                    clearInterval(bntInterval);
                    resolve(true);
                });
            });
        });
    }


    public async getLayerCachedStatus(layer: LayerInfo): Promise<LayerCachingStatus> {
        const onlineFiles = await this.getOnlineLayerTiles(layer);
        const cachedFiles = await this.getLayerCachedTiles(layer);
        const missingFiles = await this.getMissingCacheFiles(layer);

        if (onlineFiles.length == 0) {
            return 'error'
        }

        if (missingFiles.length == 0) {
            return 'cached'
        }
        if (cachedFiles.length == 0){
            return 'notCached'
        }
        if (cachedFiles.length > 0 && missingFiles.length > 0){
            return 'partly'
        }

        return 'error';
    }


    public async resetLayerCache(layer: LayerInfo): Promise<void> {
        let url: URL | undefined;
        if (layer.getUrl().startsWith('http')) {
            url = new URL(layer.getUrl().substring(0, layer.getUrl().search("{z}"))); // Ensure the URL is absolute
        } else {
            url = new URL(layer.getUrl().substring(0, layer.getUrl().search("{z}")), window.location.origin); // Ensure the URL is absolute
        }

        const path = url.pathname.replace('/overlays/', '');
        const parts = path.split('/');
        const cacheName = 'overlay-' + parts[0]; // Use the first part of the path as the cache name
        await caches.delete(cacheName)
    }
}
