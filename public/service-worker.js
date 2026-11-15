const CACHE_NAME = 'rizbandy-shell-build';
const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/logo.jpg',
  '/pwa-192.jpg',
  '/pwa-512.jpg',
];
const PRECACHE_ASSETS = [];
const MAX_CACHED_ASSETS = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([...new Set([...SHELL_URLS, ...PRECACHE_ASSETS])]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('rizbandy-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function cacheAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, {ignoreVary: true});
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    await cache.put(request, response.clone());
    const keys = await cache.keys();
    const assetKeys = keys.filter((key) => new URL(key.url).pathname.startsWith('/assets/'));
    await Promise.all(
      assetKeys.slice(0, Math.max(0, assetKeys.length - MAX_CACHED_ASSETS))
        .map((key) => cache.delete(key)),
    );
  }
  return response;
}

async function loadNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  const networkRequest = fetch(request, {signal: controller.signal})
    .then(async (response) => {
      if (response.ok) await cache.put('/', response.clone());
      return response;
    })
    .finally(() => clearTimeout(timeout));

  try {
    return await networkRequest;
  } catch {
    return (await cache.match('/', {ignoreVary: true})) || new Response(
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline</title><body><main><h1>You are offline</h1><p>Reconnect to the internet and reload Rizbandy.</p></main></body></html>',
      {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}},
    );
  }
}

self.addEventListener('fetch', (event) => {
  const {request} = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(loadNavigation(request));
    return;
  }

  const isStaticAsset = url.pathname.startsWith('/assets/') || SHELL_URLS.includes(url.pathname);
  if (isStaticAsset) {
    event.respondWith(cacheAsset(request));
  }
});
