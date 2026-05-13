const CACHE_NAME = 'salvia-ai-cache-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/chatbot.html',
    '/map.html',
    '/about.html',
    '/css/styles.css',
    '/script.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install Event: Cache all static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Caching Files');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Serve from Cache, Fallback to Network
self.addEventListener('fetch', event => {
    // DO NOT cache API requests
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            // Return cached response if found
            if (response) {
                return response;
            }

            // Otherwise, fetch from the network
            return fetch(event.request).then(networkResponse => {
                // Ignore dynamic URLs like /map.html?auto=true... from caching dynamically
                // But normally we could cache new assets here if we wanted.
                return networkResponse;
            }).catch(() => {
                // If offline and not in cache (e.g. they typed a random URL)
                // If it's a navigation request, maybe return index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
