// Minimal service worker — required for PWA installability / TWA (Google Play) packaging.
// This app is live/online-only (Supabase-backed), so we don't cache app data —
// we just pass requests straight through the network.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
