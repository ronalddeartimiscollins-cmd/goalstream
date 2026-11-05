// GoalStream service worker: network-first, falls back to the last cached copy when offline.
const V = 'gs-v1';
const SHELL = ['/', '/index.html', '/privacy.html', '/terms.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  // Only our own GET requests. Video, ads and CDN scripts always go straight to the network.
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(V).then((c) => c.put(r, copy)); }
        return res;
      })
      .catch(() => caches.match(r).then((m) => m || (r.mode === 'navigate' ? caches.match('/index.html') : Response.error())))
  );
});
