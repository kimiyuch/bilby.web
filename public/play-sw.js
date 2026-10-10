// The service worker for Bilby in the browser (/play): keeps the app working without a connection.
// The page and the Vite manifest are fetched fresh when online; built assets have hashed names, so once
// cached they never change.

const CACHE = 'bilby-play-v1';
const PAGE = '/play';

// Every file Vite built: the app, its worker, the fonts and the website's few assets. It's small, and the
// names change with every build, so read them from Vite's manifest.
async function assetUrls() {
    const manifest = await (await fetch('/build/manifest.json', { cache: 'no-cache' })).json();
    const urls = new Set();
    for (const chunk of Object.values(manifest)) {
        for (const file of [chunk.file, ...(chunk.css ?? []), ...(chunk.assets ?? [])]) urls.add('/build/' + file);
    }
    return [...urls];
}

// After a deploy: cache the new build and drop the files of older ones.
async function update() {
    try {
        const cache = await caches.open(CACHE);
        const current = new Set(await assetUrls());
        await cache.addAll([...current]);
        for (const request of await cache.keys()) {
            const path = new URL(request.url).pathname;
            if (path.startsWith('/build/') && !current.has(path)) await cache.delete(request);
        }
    } catch {
        // Offline or mid-deploy; try again next time.
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        await cache.addAll([PAGE, '/play.webmanifest', '/images/favicon.png?v=2', '/images/app-192.png']);
        await cache.addAll(await assetUrls()).catch(() => {});
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== location.origin) return;

    // The page: the network first, so updates arrive; the cached copy when offline.
    if (request.mode === 'navigate' && url.pathname === PAGE) {
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    (await caches.open(CACHE)).put(PAGE, response.clone());
                    event.waitUntil(update());
                }
                return response;
            } catch {
                return (await caches.match(PAGE)) ?? Response.error();
            }
        })());
        return;
    }

    // Built assets, fonts and images: from the cache, and cached as they're fetched.
    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/images/') || url.pathname === '/play.webmanifest') {
        event.respondWith((async () => {
            const cached = await caches.match(request);
            if (cached) return cached;
            const response = await fetch(request);
            if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
            return response;
        })());
    }
});
