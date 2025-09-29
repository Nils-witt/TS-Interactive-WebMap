/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/**
 * Custom Service Worker for MapLibre WebMap.
 * Cache strategy overview:
 * - admin: network-only (no cache)
 * - api-cache: network-first with cache fallback and backfill
 * - overlay-*: cache-first (tiles), no backfill by default
 * - vector-cache: cache-first with backfill on miss
 * - default/others: bypass (or simple fetch)
 */
const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

sw.addEventListener('install', () => {
    console.log('Service Worker installed');
});
sw.addEventListener('activate', () => {
    console.log('Service Worker activated');
    sw.clients.matchAll({
        includeUncontrolled: true
    })
        .then((clients) => {
            clients.forEach(function (client) {
                console.log('Sending message to client:', client);
                client.postMessage({cmd: "reload"})
            })
        })
});

/**
 * Classify request URL into a semantic group used to select a cache.
 * overlay-<name> for /overlays/<name>/... paths, 'api' for /api, 'vector' for /vector, 'admin' for /admin, otherwise 'default'.
 */
function getURLType(url: URL) {
    if (url.pathname.startsWith('/overlays/')) {
        let path = url.pathname.replace('/overlays/', '');
        let parts = path.split('/');

        return 'overlay-' + parts[0]; // Return overlay type
    }
    if (url.pathname.startsWith('/api/')) {
        return 'api'; // Return overlay type
    }
    if (url.pathname.startsWith('/vector/')) {
        return 'vector'; // Return overlay type
    }
    if (url.pathname.startsWith('/admin/')) {
        return 'admin'; // Return overlay type
    }


    return 'default'; // Default type
}

/**
 * Some overlay caches use absolute URLs as keys. Normalize event.request.url accordingly.
 */
function transformCacheUrl(cacheName: string, url: string): URL {
    let locURL = new URL(url);
    if (cacheName.startsWith("overlay-")) {

        console.log(`Transform ${new URL(locURL.origin + locURL.pathname)}`)
        return new URL(locURL.origin + locURL.pathname);
    }
    return new URL(url)
}

/**
 *
 * @param url
 * @return A tuple containing the cache name, whether to use network first, and whether to use cache.
 */
/**
 * Decide cache bucket and strategy for a given URL.
 * Returns tuple: [cacheName, networkFirst, useCache, putMissingInCache]
 */
function getCacheName(url: URL): [string, boolean, boolean, boolean] {
    let reqType = getURLType(url);

    if (reqType === 'admin') {
        return ['admin', true, false, false];
    }
    if (reqType === 'api') {
        return ['api-cache', true, true, true];
    }
    if (reqType.startsWith('overlay-')) {
        return [reqType, false, true, false];
    }
    if (reqType === 'vector') {
        return ['vector-cache', false, true, true];
    }
    if (sw.registration.scope.startsWith(url.origin)) {
        return [reqType, true, false, false];
    }
    console.log(`[SW] Fetch ${url}; ${url.origin} == ${sw.registration.scope}`)
    return ['never', true, false, false];

}


sw.addEventListener("fetch", (event) => {
    let url = new URL(event.request.url);
    console.log(`[SW] Fetch ${url}`)
    if (event.request.method !== 'GET') {
        return;
    }
    if (event.request.url == "https://karten.bereitschaften-drk-bonn.de/"){
        url = new URL("https://karten.bereitschaften-drk-bonn.de/index.html")
    }

    let [useCacheName, networkFirst, useCache, putMissingInCache] = getCacheName(url);
    if (useCache) {
        console.log(`Fetch ${url} useCache ${useCacheName}; netForst: ${networkFirst}; useCache ${useCache}`)
        if (networkFirst) {
            event.respondWith(
                fetch(event.request,{ signal: AbortSignal.timeout(2000) })
                    .then(response => {
                        if (response && response.ok) {
                            let responseToCache = response.clone();

                            caches.open(useCacheName).then((cache) => {
                                cache.put(event.request, responseToCache); // Cache the new response
                            });
                            return response; // Clone the response to use it in the cache
                        }
                        if (response.status === 403) {
                            return response;
                        }
                        return caches.match(event.request);

                    })
                    .catch(() => {
                        return caches.match(event.request).then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            } else {
                                return new Response("Not found", {status: 404})
                            }
                        });
                    })
            );
        } else {
            event.respondWith(caches.open(useCacheName).then((cache) => {
                return cache.match(transformCacheUrl(useCacheName, event.request.url)).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    console.log(`Locally not found: ${url}`)
                    return fetch(event.request.url).then((fetchedResponse) => {
                        if (fetchedResponse && fetchedResponse.ok && putMissingInCache) {
                            cache.put(event.request, fetchedResponse.clone());
                        }
                        return fetchedResponse;
                    });

                });
            }));
        }
    }
});