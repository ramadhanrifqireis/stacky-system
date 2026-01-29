const CACHE_NAME = 'stacky-v2-network-first';
const urlsToCache = [
  '/icon.png',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Paksa update SW baru segera
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Hapus cache lama yang bikin error
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategi: Network First (Utamakan Internet/Server, baru Cache)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return; // Jangan cache POST/PUT

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Kalau berhasil ambil dari server, simpan copy-nya ke cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return response;
      })
      .catch(() => {
        // Kalau offline/gagal, baru ambil dari cache
        return caches.match(event.request);
      })
  );
});
