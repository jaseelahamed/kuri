const CACHE_NAME = 'kuri-app-v3';

// Essential static offline fallback
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 1. Ignore non-HTTP/HTTPS schemes (e.g., chrome-extension://, moz-extension://)
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return;
  }

  // 2. Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 3. Pass API requests directly to network (no cache)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 4. Navigation requests (HTML pages): Network First, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, clone);
              } catch (e) {
                // Ignore any caching errors
              }
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('/'))
    );
    return;
  }

  // 5. Static assets: Cache First with network update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache valid responses only
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, clone);
            } catch (e) {
              // Ignore any caching errors
            }
          });
        }
        return networkResponse;
      });
    })
  );
});
