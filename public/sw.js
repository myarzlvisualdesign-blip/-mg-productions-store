const CACHE_PREFIX = 'mg-productions-'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys()
      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith(CACHE_PREFIX))
          .map((key) => caches.delete(key))
      )

      await self.registration.unregister()

      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      })

      await Promise.all(
        clients.map((client) => {
          if ('navigate' in client) {
            return client.navigate(client.url)
          }
          return Promise.resolve(undefined)
        })
      )
    })()
  )
})

self.addEventListener('fetch', () => {
  // Intentionally empty: this worker only exists to clear legacy caches
  // and unregister itself on clients that still have an older registration.
})
