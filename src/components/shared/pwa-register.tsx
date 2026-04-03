'use client'

import { useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

const PROMPT_READY_EVENT = 'mg-beforeinstallprompt-ready'
const SW_REFRESH_KEY = 'mg-sw-refresh'

export default function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined') return

    const installWindow = window as typeof window & {
      __mgDeferredPrompt?: BeforeInstallPromptEvent | null
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      installWindow.__mgDeferredPrompt = event as BeforeInstallPromptEvent
      window.dispatchEvent(new CustomEvent(PROMPT_READY_EVENT))
    }

    const handleAppInstalled = () => {
      installWindow.__mgDeferredPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (!('serviceWorker' in navigator)) {
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await navigator.serviceWorker.ready

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        const hasController = Boolean(navigator.serviceWorker.controller)
        const refreshFlag = window.sessionStorage.getItem(SW_REFRESH_KEY)

        if (!hasController && !isStandalone && !refreshFlag) {
          window.sessionStorage.setItem(SW_REFRESH_KEY, 'pending')
          window.location.reload()
          return
        }

        if (registration.active && refreshFlag) {
          window.sessionStorage.removeItem(SW_REFRESH_KEY)
        }
      } catch {
        // Ignore registration failures so the storefront continues normally.
      }
    }

    void register()

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return null
}
