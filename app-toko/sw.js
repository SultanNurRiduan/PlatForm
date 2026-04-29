const CACHE_NAME = 'toko-pwa-v2';
const urlsToCache = [
  './',
  './index.html',
  './tambah.html',
  './app.js',
  './manifest.json'
];

// ============================================================
// 1. INSTALL: Simpan file-file penting ke Cache Browser
// ============================================================
self.addEventListener('install', event => {
  console.log('[SW] Install event dipicu');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Membuka cache dan menyimpan file...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Semua file berhasil di-cache!');
        return self.skipWaiting();
      })
  );
});

// ============================================================
// 2. ACTIVATE: Hapus cache lama jika ada versi baru
// ============================================================
self.addEventListener('activate', event => {
  console.log('[SW] Activate event dipicu');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Menghapus cache lama:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ============================================================
// 3. FETCH: Network First untuk API, Cache First untuk aset
// ============================================================
self.addEventListener('fetch', event => {
  // Hanya tangani request GET
  if (event.request.method !== 'GET') return;

  // Untuk request ke API → selalu ambil dari network (data selalu fresh)
  if (event.request.url.includes('platform.test')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.warn('[SW] API tidak tersedia (offline):', event.request.url);
      })
    );
    return;
  }

  // Untuk aset statis → Cache First, fallback ke network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Melayani dari cache:', event.request.url);
          return cachedResponse;
        }

        console.log('[SW] Mengambil dari network:', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            console.warn('[SW] Network gagal, aset tidak tersedia offline:', event.request.url);
          });
      })
  );
});