// v2 — deliberately near-empty. v1 cached full pages (including /expired,
// /team, /admin) with no expiry, so once someone hit a buggy page Chrome
// kept replaying that exact saved copy forever, even after server fixes.
// This app is fully dynamic and auth-gated — pages must never be cached.
const CACHE_NAME = 'ajsuite-v2'
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Wipes every old cache, including whatever stale pages v1 saved.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  // Never touch page navigations — always go to the network, never cache.
  if (event.request.mode === 'navigate') return

  // Only ever cache the few known static assets above. Everything else
  // (API calls, Supabase, JS/CSS chunks, images, all app routes) passes
  // straight through untouched.
  const isKnownStaticAsset = STATIC_ASSETS.some(a => event.request.url.endsWith(a))
  if (!isKnownStaticAsset) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
    })
  )
})
