/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

sw.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    event.waitUntil(new Promise(async (resolve) => {

            await caches.delete('tacmap-cache')

            const cache = await caches.open('tacmap-cache');
            await cache.addAll([
                '/index.html',
            ]);
            resolve(true);
        })
    )
});
sw.addEventListener('activate', () => {
    console.log('Service Worker activated');
    sw.clients.matchAll({
        includeUncontrolled: true
    })
        .then((clients) => {
            clients.forEach(function(client) {
                console.log('Sending message to client:', client);
                client.postMessage({cmd: "reload"})
            })
        })
});

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
 *
 * @param url
 * @return A tuple containing the cache name, whether to use network first, and whether to use cache.
 */
function getCacheName(url: URL): [string, boolean, boolean] {
    let reqType = getURLType(url);

    if (reqType === 'admin') {
        return ['admin', true, false];
    }
    if (reqType === 'api') {
        return ['api-cache', true, true];
    }
    if (reqType.startsWith('overlay-')) {
        return [reqType, true, false];
    }
    if (reqType === 'vector') {
        return ['vector-cache', false, true];
    }
    if (url.origin == sw.registration.scope) {
        return [reqType, false, false];
    }
    return ['never', true, false];

}


sw.addEventListener("fetch", (event) => {
    let url = new URL(event.request.url);
    let [useCacheName, networkFirst, useCache] = getCacheName(url);
    console.log('Fetch event for:', url.href, 'Cache name:', useCacheName, 'Network first:', networkFirst, 'Use cache:', useCache);


    if (useCache) {
        if (networkFirst) {
            event.respondWith(
                fetch(event.request)
                    .then(response => {
                        if (useCache) {
                            let responseToCache = response.clone();

                            caches.open(useCacheName).then((cache) => {
                                cache.put(event.request, responseToCache); // Cache the new response
                            });
                        }
                        return response; // Clone the response to use it in the cache
                    }).catch(() => {
                    return caches.match(event.request)
                })
            );
        } else {
            event.respondWith(caches.open(useCacheName).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    return cachedResponse || fetch(event.request.url).then((fetchedResponse) => {
                        cache.put(event.request, fetchedResponse.clone());

                        return fetchedResponse;
                    });
                });
            }));
        }
    }
});