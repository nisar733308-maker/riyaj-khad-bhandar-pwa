const CACHE_NAME = 'khad-v58';
const STATIC_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './products.js',
  './cart.js',
  './manifest.json'
];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_CACHE)).then(() => self.skipWaiting())
));

self.addEventListener('fetch', e => {
  // HTML फाइलों के लिए: 'Network First' स्ट्रेटेजी ताकि नया अपडेट तुरंत मिले
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // अन्य फाइलों के लिए: Cache First
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return response;
      });
    })
  );
});

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
  ))
));
