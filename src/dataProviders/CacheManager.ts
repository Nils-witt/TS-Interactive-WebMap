
export class CacheManager {


    static async clearMapData() {
        const names = await caches.keys();

        for (const name of names) {
            if (name.startsWith("overlay-")) {
                await caches.delete(name);
            } else if (name.startsWith("vector-cache")) {
                await caches.delete(name);
            }
        }
    }
}
