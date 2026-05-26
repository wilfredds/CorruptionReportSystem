const CACHE_NAME = 'bikeguide-v2';

// Relative paths — resolve correctly whether hosted at domain root
// or in a subfolder like /CorruptionReportSystem/bike-guide-app/
const STATIC_ASSETS = [
  'index.html',
  'dashboard.html',
  'knowledge.html',
  'gear-guide.html',
  'maintenance.html',
  'safety.html',
  'warmup.html',
  'diet.html',
  'challenge.html',
  'routes.html',
  'tracker.html',
  'carbon.html',
  'motivation.html',
  'premium.html',
  'offline.html',
  'css/style.css',
  'css/animations.css',
  'js/app.js',
  'js/firebase-config.js',
  'js/challenge.js',
  'js/tracker.js',
  'js/carbon.js',
  'js/gear-simulator.js',
  'js/bike-doctor.js',
  'js/routes.js',
  'js/premium.js',
  'assets/data/tips.json',
  'assets/data/routes.json',
  'assets/data/exercises.json',
  'assets/data/troubleshooting.json',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'manifest.json',
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
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

  // Always go to network for Firebase and external APIs
  if (url.hostname.includes('firestore') || url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    event.respondWith(fetch(event.request).catch(() => caches.match('offline.html')));
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
        .catch(() => {
          if (event.request.mode === 'navigate') return caches.match('offline.html');
        });
    })
  );
});
