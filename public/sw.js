// HOXA Service Worker — PWA + Push Notifications
const CACHE_NAME = 'hoxa-v1';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Push Notifications ──────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'HOXA', {
      body: data.message ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/' },
      tag: data.tag ?? 'hoxa',
      renotify: true,
      requireInteraction: data.type === 'error' || data.type === 'warning',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate?.(url);
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// ── Fetch: network-first strategy (online-first app) ──
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip navigation requests — let the browser handle redirects from proxy/middleware
  if (event.request.mode === 'navigate') return;

  // Skip API / auth requests
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline fallback
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
