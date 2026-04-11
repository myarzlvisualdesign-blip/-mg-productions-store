'use client'

import { useEffect } from 'react'

const CLEANUP_KEY = 'mg-cache-cleanup-v1'

export default function LegacyCacheCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    void (async () => {
      try {
        if (window.localStorage.getItem(CLEANUP_KEY) === 'done') {
          return
        }

        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(
            registrations.map(async (registration) => {
              const scriptUrl =
                registration.active?.scriptURL ||
                registration.waiting?.scriptURL ||
                registration.installing?.scriptURL ||
                ''

              if (scriptUrl && !scriptUrl.endsWith('/sw.js')) {
                await registration.unregister()
                return
              }

              await registration.update().catch(() => {})
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

        window.localStorage.setItem(CLEANUP_KEY, 'done')
      } catch {
        // Ignore cleanup failures and let the app continue normally.
      }
    })()
  }, [])

  return null
}
