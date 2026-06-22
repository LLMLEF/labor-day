// ⚠️ Replace every instance of 'your-repo-name' with your actual GitHub repo name
const CACHE_NAME = 'laborday-2025-v1';

const ASSETS_TO_CACHE = [
    '/labor-day/',
    '/labor-day/index.html',
    '/labor-day/manifest.json',
    '/labor-day/icons/icon-192x192.png',
    '/labor-day/icons/icon-512x512.png'
];

// ── INSTALL: Pre-cache the app shell ─────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// ── ACTIVATE: Remove outdated caches ─────────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Removing old cache:', name);
                        return caches.delete(name);
                    })
            )
        )
    );
    self.clients.claim();
});

// ── FETCH: Cache-first strategy ──────────────────────────────
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Never cache Google Apps Script API calls — always go to network
    if (event.request.url.includes('script.google.com')) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached; // Serve from cache if available

            return fetch(event.request)
                .then((response) => {
                    // Cache valid same-origin responses
                    if (response && response.status === 200 && response.type === 'basic') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Offline fallback — serve the main app page
                    console.log('[SW] Offline — serving cached app');
                    return caches.match('/your-repo-name/index.html');
                });
        })
    );
});