const CACHE_NAME = 'piff-paff-gym-v2.12.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './vendor/chart.umd.min.js',
  './assets/atlas-front.jpg',
  './assets/atlas-back.jpg',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './js/config.js',
  './js/storage.js',
  './js/auth.js',
  './js/app.js',
  './js/data/workouts.js',
  './js/data/tips.js',
  './js/data/demo-users.js',
  './js/modules/entitlements.js',
  './js/modules/workout-engine.js',
  './js/modules/atlas.js',
  './js/modules/exercise-demo.js',
  './js/modules/progress-hub.js',
  './js/modules/profile.js',
  './js/modules/goals.js',
  './js/modules/evolution.js',
  './js/modules/story-card.js',
  './js/modules/charts.js',
  './js/modules/nutrition.js',
  './js/modules/spotify.js',
  './js/modules/admin.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((oldKey) => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (
    url.hostname.includes('spotify.com') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('firestore.googleapis.com')
  ) {
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
