'use client'

import { useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

const PROMPT_READY_EVENT = 'mg-beforeinstallprompt-ready'

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
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch {
        // Ignore registration failures so the storefront continues normally.
      }
    }

    if (document.readyState === 'complete') {
      void register()
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }

    window.addEventListener('load', register, { once: true })
    return () => {
      window.removeEventListener('load', register)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return null
}
