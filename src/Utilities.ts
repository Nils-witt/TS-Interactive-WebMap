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
        localStorage.removeItem('apiToken')
    }
}