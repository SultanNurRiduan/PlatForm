const CACHE_NAME = 'toko-pwa-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// ============================================================
// 1. TAHAP INSTALL: Simpan file-file penting ke Cache Browser
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
        // Langsung aktif tanpa menunggu tab lama ditutup
        return self.skipWaiting();
      })
  );
});

// ============================================================
// 2. TAHAP ACTIVATE: Hapus cache lama jika ada versi baru
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
      // Langsung klaim semua halaman yang terbuka
      return self.clients.claim();
    })
  );
});

// ============================================================
// 3. TAHAP FETCH: Sajikan dari Cache, fallback ke Network
// Strategi: Cache First → Network Fallback
// ============================================================
self.addEventListener('fetch', event => {
  // Hanya tangani request GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Jika ada di cache → langsung kembalikan dari cache
        if (cachedResponse) {
          console.log('[SW] Melayani dari cache:', event.request.url);
          return cachedResponse;
        }

        // Jika tidak ada di cache → ambil dari network
        console.log('[SW] Mengambil dari network:', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            // Simpan response baru ke cache untuk berikutnya
            // (hanya untuk request yang sukses)
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Jika network juga gagal (offline), tampilkan fallback
            console.warn('[SW] Network gagal, aset tidak tersedia offline:', event.request.url);
          });
      })
  );
});