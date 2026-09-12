// Cache Storage is scoped to the ORIGIN, not to this app's path, and
// simeonsimon.github.io also hosts 60-reps and anki-on-iphone. Only ever
// touch caches carrying this prefix — never the whole key list.
const CACHE_PREFIX = 'finance-';
const CACHE_VERSION = CACHE_PREFIX + 'v3';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/apple-splash-1179x2556.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(CACHE_VERSION).then(function(cache) {
    return cache.addAll(PRECACHE);
  }).then(function() {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function(event) {
  event.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(key) {
      return key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_VERSION;
    }).map(function(key) {
      return caches.delete(key);
    }));
  }).then(function() {
    return self.clients.claim();
  }));
});

function networkFirst(request) {
  return fetch(request).then(function(response) {
    if (response && response.ok) {
      caches.open(CACHE_VERSION).then(function(cache) { cache.put(request, response.clone()); });
    }
    return response;
  }).catch(async function() {
    var cached = await caches.match(request);
    if (cached) return cached;
    var index = await caches.match('./index.html');
    if (index) return index;
    return caches.match('./');
  });
}

function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    return cached || fetch(request).then(function(response) {
      if (response && response.ok) {
        caches.open(CACHE_VERSION).then(function(cache) { cache.put(request, response.clone()); });
      }
      return response;
    });
  });
}

self.addEventListener('fetch', function(event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.hostname === 'api.anthropic.com' || url.hostname === 'api.github.com') return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.endsWith('/manifest.webmanifest') || url.pathname.indexOf('/icons/') !== -1) {
    event.respondWith(cacheFirst(request));
  }
});
