/*
 * sw-custom.ts
 * ----------------
 * Custom service worker entry for the application.
 * Purpose: register or extend service worker behavior (caching, update handling).
 * Exports: (none) - this file is intended to be included/registered by the build
 * side-effects: registers service worker hooks at runtime.
 * Notes: keep the file small and idempotent; avoid importing large runtime-only
 *       dependencies to reduce bundle size.
 */

/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;



const vectorCacheUrls: Record<string, RegExp> = {};
const overlayCacheUrls: Record<string, RegExp> = {};

new BroadcastChannel('addVectorCacheUrl').addEventListener('message', (e: { data: { url: string; id: string } }) => {
    const url = e.data.url;
    const id = e.data.id;
    vectorCacheUrls[id] = new RegExp(`^${url}.*$`);

    log(`[SW] Added VectorCacheUrl ${id} is ${vectorCacheUrls[id]}`);
});

new BroadcastChannel('addOverlayCacheUrl').addEventListener('message', (e: { data: { url: string; id: string } }) => {
    const url = e.data.url;
    const id = e.data.id;

    overlayCacheUrls[id] = overlayRegex(url);
    log(`[SW] Added OverlayCacheUrl ${id} is ${overlayCacheUrls[id]}`);
});
new BroadcastChannel('removeOtherOverlayCaches').addEventListener('message', (e: { data: { version: string; id: string } }) => {
    const id = e.data.id;
    const version = e.data.version;
    log(`[SW] Removing Old Overlays ${id} != ${version}`);
    void caches.keys().then(keys => {
        keys.forEach(key => {
            if (key.startsWith(`overlay-${id}`) && key != `overlay-${id}_${version}`) {
                void caches.delete(key);
            }
        });
    });
});
sw.addEventListener('activate', () => {
    log('Service Worker activated', sw.registration);
    reloadClients();
});


function overlayRegex(url: string): RegExp {
    return new RegExp(`^${url.replaceAll('.', '\\.').replace('{x}', '\\d+').replace('{y}', '\\d+').replace('{z}', '\\d+')}(\\?.*)?$`);
}


function reloadClients() {
    void sw.clients.matchAll({
        includeUncontrolled: true
    }).then((clients) => {
        clients.forEach(function (client) {
            console.log('Sending message to client:', client);
            client.postMessage({ cmd: 'reload' });
        });
    });
}



function transformCacheUrl(cacheName: string, url: string): URL {
    const locURL = new URL(url);
    if (cacheName.startsWith('overlay-')) {
        return new URL(locURL.origin + locURL.pathname);
    }
    return new URL(url);
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
    //const reqType = getURLType(url);

    if (sw.registration.scope.startsWith(url.origin)) {
        return ['never', true, false, false];
    }
    for (const [id, regex] of Object.entries(vectorCacheUrls)) {
        if (regex.test(url.href)) {
            return [`vector-cache-${id}`, true, true, true];
        }
    }
    for (const [id, regex] of Object.entries(overlayCacheUrls)) {
        if (regex.test(url.href)) {
            return [`overlay-${id}`, true, true, true];
        }
    }
    return ['never', true, false, false];

}


sw.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET') {
        return;
    }

    const [useCacheName, networkFirst, useCache, putMissingInCache] = getCacheName(url);
    if (useCache) {
        if (networkFirst) {
            event.respondWith(new Promise((resolve, reject) => {
                fetch(event.request, { signal: AbortSignal.timeout(2000) })
                    .then(async response => {
                        if (response && response.ok) {
                            const responseToCache = response.clone();

                            void caches.open(useCacheName).then((cache) => {
                                void cache.put(event.request, responseToCache); // Cache the new response
                            });
                            resolve(response);
                            return;
                        } else if (response.status === 403) {
                            resolve(response);
                            return;
                        }

                        const cacheMatch = await caches.match(event.request);
                        if (cacheMatch != undefined) {
                            resolve(cacheMatch);
                            return;
                        } else {
                            reject(new Error(`Could not fetch ${event.request.url}`));
                        }
                        return;

                    })
                    .catch(() => {
                        return caches.match(event.request).then((cachedResponse) => {
                            if (cachedResponse) {
                                resolve(cachedResponse);
                            } else {
                                resolve(new Response('Not found', { status: 404 }));
                            }
                        });
                    });
            }));
        } else {
            event.respondWith(caches.open(useCacheName).then((cache) => {
                return cache.match(transformCacheUrl(useCacheName, event.request.url)).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request.url).then((fetchedResponse) => {
                        if (fetchedResponse && fetchedResponse.ok && putMissingInCache) {
                            cache.put(event.request, fetchedResponse.clone())
                                .catch((e) => {
                                    console.error('Error caching fetched response:', e);
                                });
                        }
                        return fetchedResponse;
                    });
                });
            }));
        }
    }
});



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.log('[SW]', ...args);
}