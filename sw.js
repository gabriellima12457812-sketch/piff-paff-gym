const CACHE_NAME = 'piff-paff-gym-v2.18.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './vendor/chart.umd.min.js',
  './assets/atlas-front.jpg',
  './assets/atlas-back.jpg',
  './assets/demos/abs_core_a.jpg?v=4',
  './assets/demos/abs_core_b.jpg?v=4',
  './assets/demos/bench_press_a.jpg?v=4',
  './assets/demos/bench_press_b.jpg?v=4',
  './assets/demos/db_bench_press_a.jpg?v=4',
  './assets/demos/db_bench_press_b.jpg?v=4',
  './assets/demos/biceps_curl_a.jpg?v=4',
  './assets/demos/biceps_curl_b.jpg?v=4',
  './assets/demos/calf_raise_a.jpg?v=4',
  './assets/demos/calf_raise_b.jpg?v=4',
  './assets/demos/chest_fly_a.jpg?v=4',
  './assets/demos/chest_fly_b.jpg?v=4',
  './assets/demos/hip_thrust_a.jpg?v=4',
  './assets/demos/hip_thrust_b.jpg?v=4',
  './assets/demos/lateral_raise_a.jpg?v=4',
  './assets/demos/lateral_raise_b.jpg?v=4',
  './assets/demos/pulldown_a.jpg?v=4',
  './assets/demos/pulldown_b.jpg?v=4',
  './assets/demos/pushup_a.jpg?v=4',
  './assets/demos/pushup_b.jpg?v=4',
  './assets/demos/rdl_hinge_a.jpg?v=4',
  './assets/demos/rdl_hinge_b.jpg?v=4',
  './assets/demos/row_a.jpg?v=4',
  './assets/demos/row_b.jpg?v=4',
  './assets/demos/shoulder_press_a.jpg?v=4',
  './assets/demos/shoulder_press_b.jpg?v=4',
  './assets/demos/squat_a.jpg?v=4',
  './assets/demos/squat_b.jpg?v=4',
  './assets/demos/triceps_ext_a.jpg?v=4',
  './assets/demos/triceps_ext_b.jpg?v=4',
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
  './js/modules/cardio.js',
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

  // Nunca interceptar Range requests ou arquivos MP4 (evita tela preta em vídeo no iOS Safari)
  const url = new URL(request.url);
  if (
    request.headers.get('range') ||
    url.pathname.endsWith('.mp4') ||
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

// Agendamento em segundo plano para notificação de fim de descanso (mantém vivo via waitUntil)
let scheduledRestTimer = null;

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CANCEL_REST_NOTIFY') {
    if (scheduledRestTimer) {
      clearTimeout(scheduledRestTimer);
      scheduledRestTimer = null;
    }
    return;
  }

  if (data.type === 'SCHEDULE_REST_NOTIFY') {
    if (scheduledRestTimer) {
      clearTimeout(scheduledRestTimer);
      scheduledRestTimer = null;
    }
    const delayMs = Math.max(1000, Math.min(600000, Number(data.delayMs) || 60000));
    const title = data.title || '⏱️ Descanso Finalizado — Piff Paff Gym';
    const body = data.body || 'Hora da próxima série!';
    const icon = data.icon || './icons/icon-192.png';

    const p = new Promise((resolve) => {
      scheduledRestTimer = setTimeout(async () => {
        scheduledRestTimer = null;
        try {
          await self.registration.showNotification(title, {
            body,
            icon,
            badge: icon,
            vibrate: [220, 100, 220, 100, 320],
            tag: 'piff-paff-rest-done',
            renotify: true,
          });
        } catch {
          try {
            await self.registration.showNotification(title, { body, tag: 'piff-paff-rest-done' });
          } catch {
            // Ignora se permissão não concedida
          }
        }
        resolve();
      }, delayMs);
    });

    if (typeof event.waitUntil === 'function') {
      event.waitUntil(p);
    }
  }
});
