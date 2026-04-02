'use client'

import { useEffect } from 'react'

const CACHE_PREFIX = 'mg-productions-'
const RELOAD_FLAG = 'mg-sw-reset-complete'

export default function ServiceWorkerReset() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let cancelled = false

    const clearLegacyRuntime = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        const hadRegistrations = registrations.length > 0

        await Promise.all(registrations.map((registration) => registration.unregister()))

        if ('caches' in window) {
          const cacheKeys = await caches.keys()
          await Promise.all(
            cacheKeys
              .filter((key) => key.startsWith(CACHE_PREFIX))
              .map((key) => caches.delete(key))
          )
        }

        if (cancelled || !hadRegistrations) return

        const alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG) === '1'
        if (!alreadyReloaded) {
          window.sessionStorage.setItem(RELOAD_FLAG, '1')
          window.location.reload()
        }
      } catch {
        // Ignore cleanup failures and let the app continue normally.
      }
    }

    clearLegacyRuntime()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
