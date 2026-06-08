const CACHE_NAME = 'apptoko-pwa-v4';
const urlsToCache = [
    './',
    './index.html',
    './login.html',
    './app.js',
    './manifest.json'
];

// ============================================================
// 1. INSTALL — Cache file-file statis
// ============================================================
self.addEventListener('install', event => {
    console.log('[SW] Install v4');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// ============================================================
// 2. ACTIVATE — Hapus cache versi lama
// ============================================================
self.addEventListener('activate', event => {
    console.log('[SW] Activate v4');
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            )
        ).then(() => self.clients.claim())
    );
});

// ============================================================
// 3. FETCH — Network First untuk API, Cache First untuk aset
// ============================================================
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = event.request.url;

    // Untuk request ke API → selalu ambil dari network (data fresh)
    if (url.includes('infinityfreeapp.com') || url.includes('api-toko')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                console.warn('[SW] API tidak tersedia (offline):', url);
                // Kembalikan respons error JSON sederhana agar app tidak crash
                return new Response(
                    JSON.stringify({ status: 'error', pesan: 'Anda sedang offline.' }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            })
        );
        return;
    }

    // Untuk CDN eksternal (Tailwind, FontAwesome, Google Fonts) → Network First
    if (url.includes('cdn.tailwindcss.com') || url.includes('fonts.googleapis.com') ||
        url.includes('cdnjs.cloudflare.com') || url.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Untuk aset statis lokal → Cache First, fallback ke network
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(event.request)
                    .then(response => {
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                        }
                        return response;
                    })
                    .catch(() => {
                        console.warn('[SW] Aset offline tidak tersedia:', url);
                    });
            })
    );
});