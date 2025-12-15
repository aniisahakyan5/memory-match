const CACHE_NAME = 'memory-match-v2'; // Increment version to force cache refresh
const ASSETS_TO_CACHE = [
    // DO NOT cache index.html or ./ - they need server-side env injection
    './style.css',
    './style_append.css',
    './script.js',
    './db-cloud.js',
    './auth.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Force immediate activation
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Network First for HTML files (to get fresh env injection)
    if (event.request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Fallback to cache only if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache First for static assets (CSS, JS, images)
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control immediately
    );
});
