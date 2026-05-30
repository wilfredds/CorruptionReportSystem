const CACHE_NAME = 'bikeguide-v3';
const RUNTIME_CACHE = 'bikeguide-runtime-v3';

// Relative paths resolve against the service worker's location, so the app
// works whether hosted at the domain root or a GitHub Pages project subpath.
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
  'js/ui.js',
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
  'manifest.json',
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches, keep current static + runtime caches
self.addEventListener('activate', event => {
  const keep = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Runtime-cacheable third-party hosts (fonts + icon CSS) so repeat
// visits render instantly even on the very first page after install.
function isCacheableThirdParty(url) {
  return url.hostname.includes('fonts.googleapis.com') ||
         url.hostname.includes('fonts.gstatic.com') ||
         url.hostname.includes('cdnjs.cloudflare.com');
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Firestore/Firebase data must always be live.
  if (url.hostname.includes('firestore') || url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') && !isCacheableThirdParty(url)) {
    event.respondWith(fetch(event.request).catch(() => caches.match('offline.html')));
    return;
  }

  // HTML navigations: network-first so users get fresh content, fall back
  // to the cached page (or offline shell) when the network is unavailable.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match(event.request).then(c => c || caches.match('offline.html')))
    );
    return;
  }

  // Fonts / icon CSS: stale-while-revalidate from the runtime cache.
  if (isCacheableThirdParty(url)) {
    event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
    return;
  }

  // Everything else (local static assets): stale-while-revalidate — instant
  // from cache, refreshed in the background for the next load.
  event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
});

function staleWhileRevalidate(request, cacheName) {
  return caches.match(request).then(cached => {
    const network = fetch(request)
      .then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(cacheName).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => cached || caches.match('offline.html'));
    return cached || network;
  });
}
