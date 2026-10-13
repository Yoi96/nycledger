// Service Worker: Purges all obsolete caches and unregisters to prevent caching conflicts in preview/dev
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Do not intercept ANY fetch events — allow direct network access
self.addEventListener('fetch', () => {
  return;
});
