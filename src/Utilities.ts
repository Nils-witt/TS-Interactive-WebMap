export class Utilities {


    static async clearCache(): Promise<void> {
        const cacheNames = await caches.keys()

        await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
        );
    }

    static async clearMapCache(): Promise<void> {
        const cacheNames = await caches.keys()

        await Promise.all(
            cacheNames.filter((name) => {
                return name == "vector-cache" || name.startsWith('overlay-')
            }).map((cacheName) => caches.delete(cacheName))
        );
    }


    static logout(): void {
        localStorage.removeItem('apiToken');
        document.location.reload();
    }

    static sleep(millis = 0) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }

    static splitTileUrl(tileUrl: string): { baseUrl: string, x: number, y: number, z: number, format: string } {
        const regex = /(.*)\/(\d+)\/(\d+)\/(\d+)\.(\w+)$/;
        const match = tileUrl.match(regex);
        if (!match) {
            throw new Error(`Invalid tile URL format: ${tileUrl}`);
        }
        return {
            baseUrl: match[1],
            z: parseInt(match[2], 10),
            x: parseInt(match[3], 10),
            y: parseInt(match[4], 10),
            format: match[5]
        }

    }
}