// CharityOrg Service Worker v1.0
const CACHE_NAME = 'charityorg-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/campaigns',
  '/about',
  '/contact',
  '/offline.html',
];

// ── Install: pre-cache key pages ─────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline resources');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache failed (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network-first with cache fallback ─────────────
self.addEventListener('fetch', (event) => {
  // Skip non-GET, non-HTTP(S), and API requests
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith('http') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for HTML pages
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ── Push Notifications ────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'CharityOrg';
  const options = {
    body:    data.body    || 'You have a new notification',
    icon:    data.icon    || '/icon-192.png',
    badge:   '/icon-192.png',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});

// ── Background Sync ───────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-donations') {
    event.waitUntil(syncPendingDonations());
  }
});

async function syncPendingDonations() {
  console.log('[SW] Background sync: pending donations');
}
