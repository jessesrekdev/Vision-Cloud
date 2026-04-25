self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Let the browser do its default thing for all requests
  e.respondWith(fetch(e.request).catch(() => new Response("Network error")));
});
