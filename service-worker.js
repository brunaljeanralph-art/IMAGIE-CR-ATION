// Imagie Création service worker. Network-first for pages, stale-while-revalidate for static files.
// Push messages are shown only after the visitor explicitly grants browser notification permission.
const CACHE = 'imagie-shell-v4';
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/assets/imagie-logo-original.jpg', '/assets/icon-192.png', '/assets/icon-512.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) { payload = { body: event.data?.text() || '' }; }
  const title = String(payload.title || 'IMAGIE CRÉATION').slice(0, 90);
  const body = String(payload.body || 'Une nouveauté vous attend.').slice(0, 220);
  const target = typeof payload.url === 'string' && payload.url.startsWith('/') && !payload.url.startsWith('//') ? payload.url : '/';
  event.waitUntil(self.registration.showNotification(title, {
    body, icon: '/assets/icon-192.png', badge: '/assets/icon-192.png',
    data: { url: target }, tag: 'imagie-community-update', renotify: true
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url.startsWith(self.location.origin));
    if (existing) { existing.navigate(target); return existing.focus(); }
    return self.clients.openWindow(target);
  }));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/^\/(auth|rest|storage|functions)\//.test(url.pathname) || url.pathname === '/admin.html') return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html'))));
    return;
  }
  if (['script', 'style', 'image', 'font'].includes(request.destination) || url.pathname.startsWith('/data/')) {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(request).then((cached) => {
      const network = fetch(request).then((response) => { if (response.ok) cache.put(request, response.clone()); return response; }).catch(() => cached);
      return cached || network;
    })));
  }
});
