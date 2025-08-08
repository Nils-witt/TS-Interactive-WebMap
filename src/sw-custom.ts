/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

sw.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    console.log('Service Worker:', event);
    event.waitUntil(
        caches.open('tacmap-cache').then((cache) => {
            cache.addAll([
                '/index.html',
            ]);
        })
    )
});
sw.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    console.log('Service Worker:', event);
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
        return [reqType, false, true];
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
            event.respondWith(
                caches.match(event.request)
                    .then((response) => {
                        console.log('Cache match for:', event.request.url, 'Response:', response);
                        if (response) {
                            return response; // Return cached response if found
                        }
                        fetch(event.request).then((response) => {
                            if (!response || response.status !== 200) {
                                return response;
                            }

                            let responseToCache = response.clone();

                            caches.open(useCacheName).then((cache) => {
                                cache.put(event.request, responseToCache); // Cache the new response
                            });
                            return response; // Return the fetched response
                        }).catch(() => {
                            return new Response('Error fetching the resource', {status: 400});
                        });
                    })
            )
        }
    }
});