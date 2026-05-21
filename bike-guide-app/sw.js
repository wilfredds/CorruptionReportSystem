const CACHE_NAME = 'bikeguide-v1';

const STATIC_ASSETS = [
  '/bike-guide-app/index.html',
  '/bike-guide-app/dashboard.html',
  '/bike-guide-app/knowledge.html',
  '/bike-guide-app/gear-guide.html',
  '/bike-guide-app/maintenance.html',
  '/bike-guide-app/safety.html',
  '/bike-guide-app/warmup.html',
  '/bike-guide-app/diet.html',
  '/bike-guide-app/challenge.html',
  '/bike-guide-app/routes.html',
  '/bike-guide-app/tracker.html',
  '/bike-guide-app/carbon.html',
  '/bike-guide-app/motivation.html',
  '/bike-guide-app/premium.html',
  '/bike-guide-app/offline.html',
  '/bike-guide-app/css/style.css',
  '/bike-guide-app/css/animations.css',
  '/bike-guide-app/js/app.js',
  '/bike-guide-app/js/firebase-config.js',
  '/bike-guide-app/js/challenge.js',
  '/bike-guide-app/js/tracker.js',
  '/bike-guide-app/js/carbon.js',
  '/bike-guide-app/js/gear-simulator.js',
  '/bike-guide-app/js/bike-doctor.js',
  '/bike-guide-app/js/routes.js',
  '/bike-guide-app/js/premium.js',
  '/bike-guide-app/assets/data/tips.json',
  '/bike-guide-app/assets/data/routes.json',
  '/bike-guide-app/assets/data/exercises.json',
  '/bike-guide-app/assets/data/troubleshooting.json',
  '/bike-guide-app/manifest.json',
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for Firebase/API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network for Firebase and external APIs
  if (url.hostname.includes('firestore') || url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    event.respondWith(fetch(event.request).catch(() => caches.match('/bike-guide-app/offline.html')));
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/bike-guide-app/offline.html'));
    })
  );
});
