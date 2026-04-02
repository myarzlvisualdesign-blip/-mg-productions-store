'use client'

import { useEffect } from 'react'

export default function LegacyCacheCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    void (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(
            registrations.map(async (registration) => {
              const scriptUrl =
                registration.active?.scriptURL ||
                registration.waiting?.scriptURL ||
                registration.installing?.scriptURL ||
                ''

              if (scriptUrl.includes('/sw.js')) {
                await registration.unregister()
              }
            })
          )
        }

        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(
            keys
              .filter((key) => key.startsWith('mg-productions'))
              .map((key) => caches.delete(key))
          )
        }
      } catch {
        // Ignore cleanup failures and let the app continue normally.
      }
    })()
  }, [])

  return null
}
