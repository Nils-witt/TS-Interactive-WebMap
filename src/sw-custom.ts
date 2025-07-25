/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

sw.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    console.log('Service Worker:', event);
});
sw.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    console.log('Service Worker:', event);
});

function getURLType(url) {
    if (url.startsWith('https://map.nils-witt.de/')) {
        if (url.startsWith('https://map.nils-witt.de/overlays/')) {
            let path = url.replace('https://map.nils-witt.de/overlays/', '');
            let parts = path.split('/');

            return 'overlay-' + parts[0]; // Return overlay type
        }
        if (url.startsWith('https://map.nils-witt.de/api/')) {
            return 'api'; // Return overlay type
        }
        if (url.startsWith('https://map.nils-witt.de/vector/')) {
            return 'vector'; // Return overlay type
        }
    }

    return 'default'; // Default type
}


function getCacheName(url: string): [string, boolean, boolean] {
    let reqType = getURLType(url);


    if (reqType === 'api') {
        return ['api-cache', true, true];
    }
    if (reqType.startsWith('overlay-')) {
        return [reqType, false, true];
    }
    return ['never', true, false];

}

sw.addEventListener("fetch", (event) => {
    let url = event.request.url;

    let [useCacheName, networkFirst, useCache] = getCacheName(url);

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
        return;
    } else {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {


                    if (response) {
                        fetch(event.request).then((response) => {
                            if (!response || response.status !== 200) {
                                return response; // Return the response if it's not cacheable
                            }

                            let responseToCache = response.clone();

                            caches.open(useCacheName).then((cache) => {
                                cache.put(event.request, responseToCache); // Cache the new response
                            });
                        }).catch(() => {
                            return null;
                        })
                        return response; // Return cached response if found
                    }
                    return fetch(event.request).then((response) => {
                        if (!response || response.status !== 200) {
                            return response; // Return the response if it's not cacheable
                        }

                        let responseToCache = response.clone();

                        caches.open(useCacheName).then((cache) => {
                            cache.put(event.request, responseToCache); // Cache the new response
                        });
                        return response; // Return the fetched response
                    }).catch(() => {
                        return null;
                    });

                })
        );
        return;
    }

});