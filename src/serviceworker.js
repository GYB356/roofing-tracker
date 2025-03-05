// src/service-worker.js
/* eslint-disable no-restricted-globals */

// This service worker can be customized
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { NetworkFirst, NetworkOnly, CacheFirst } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;

// Cache static assets that don't contain PHI
registerRoute(
  ({ request }) => request.destination === 'style' || 
                    request.destination === 'script' || 
                    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        maxEntries: 100,
      }),
    ],
  })
);

// Cache images (non-PHI)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        maxEntries: 50,
      }),
    ],
  })
);

// Network-first for API routes
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

// PHI-containing routes should never be cached
registerRoute(
  ({ url }) => 
    url.pathname.includes('/medical-records/') || 
    url.pathname.includes('/lab-results/') || 
    url.pathname.includes('/prescriptions/'),
  new NetworkOnly()
);

// Handle offline functionality
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate' && !navigator.onLine) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(new Request('/offline.html'));
      })
    );
  }
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = ['static-resources', 'images', 'api-responses'];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Force clients to update when new service worker is available
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Log security events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SECURITY_EVENT') {
    const { action, details, userId } = event.data;
    
    // In a real implementation, this would send to a secure logging endpoint
    console.log('[SW] Security Event:', action, details, userId);
  }
});