const CACHE_NAME = 'khad-v69-optimized';

// Static assets
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './products.js',
  './cart.js',
  './manifest.json'
];

// ================= INSTALL =================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('SW Install Error:', err))
  );
});

// ================= FETCH =================
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 🔹 Handle navigation (HTML) - Network First
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 🔹 Handle other requests - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ================= STRATEGIES =================

// Network First (for HTML pages)
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('./index.html');
  }
};

// Stale While Revalidate (for CSS, JS, images)
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || fetchPromise;
};

// ================= ACTIVATE =================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});