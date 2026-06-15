const CACHE_NAME = 'ajsuite-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
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
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return
  // Don't cache API or Supabase calls
 if (event.request.url.includes('/api/') || 
    event.request.url.includes('supabase') ||
    event.request.url.includes('/dashboard') ||
    event.request.url.includes('/cases') ||
    event.request.url.includes('/auth') ||
    event.request.url.includes('/claim')) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      }).catch(() => cached || new Response('Offline', { status: 503 }))
    })
  )
})
