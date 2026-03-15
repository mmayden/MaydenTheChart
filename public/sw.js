/**
 * Service Worker — Minimal network-first strategy.
 *
 * - API calls always go to network (never cached).
 * - Static assets (JS, CSS, fonts, images) use network-first with
 *   a cache fallback for offline support.
 * - On install, immediately activate (no waiting for old tabs).
 */

const CACHE_NAME = 'cheechart-v1'

// Assets to pre-cache on install (app shell)
const PRECACHE = [
  '/',
  '/index.html',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Clean up old caches from previous versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // API calls — always network, never cache
  if (url.pathname.startsWith('/api/')) return

  // WebSocket upgrades — skip
  if (request.headers.get('upgrade') === 'websocket') return

  // Everything else — network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful same-origin responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
