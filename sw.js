// Service Worker per PWA Nauticovi
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Gestore delle richieste di rete per abilitare l'installazione PWA
});
