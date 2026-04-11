'use client'

import { useEffect, useRef } from 'react'
import { broadcastLiveSync, type LiveSyncTopic } from '@/lib/live-sync'

const STOREFRONT_TOPICS: LiveSyncTopic[] = [
  'products',
  'categories',
  'partners',
  'topup',
  'food',
  'travel',
  'destinations',
  'topup-banners',
  'chatbot-settings',
  'referral-settings',
]

type LiveSyncSnapshot = Partial<Record<LiveSyncTopic, string>>

function hasWindow() {
  return typeof window !== 'undefined'
}

export default function StorefrontLiveSync() {
  const previousSnapshotRef = useRef<LiveSyncSnapshot | null>(null)
  const requestInFlightRef = useRef(false)

  useEffect(() => {
    if (!hasWindow()) return

    let intervalId: ReturnType<typeof setInterval> | null = null

    const canRefresh = () =>
      document.visibilityState === 'visible' &&
      (typeof navigator === 'undefined' || navigator.onLine !== false)

    const poll = async ({ force = false }: { force?: boolean } = {}) => {
      if (requestInFlightRef.current) return
      if (!force && !canRefresh()) return

      requestInFlightRef.current = true

      try {
        const response = await fetch(`/api/live-sync?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        })

        if (!response.ok) {
          return
        }

        const data = await response.json() as { topics?: LiveSyncSnapshot }
        const nextSnapshot = data.topics ?? {}
        const previousSnapshot = previousSnapshotRef.current

        if (previousSnapshot) {
          const changedTopics = STOREFRONT_TOPICS.filter(
            (topic) => previousSnapshot[topic] !== nextSnapshot[topic]
          )

          if (changedTopics.length > 0) {
            broadcastLiveSync(...changedTopics)
          }
        }

        previousSnapshotRef.current = nextSnapshot
      } catch {
        // Ignore transient network failures and keep the next poll alive.
      } finally {
        requestInFlightRef.current = false
      }
    }

    const startInterval = () => {
      if (intervalId) {
        clearInterval(intervalId)
      }

      if (!canRefresh()) return

      intervalId = setInterval(() => {
        void poll()
      }, 3000)
    }

    const stopInterval = () => {
      if (!intervalId) return
      clearInterval(intervalId)
      intervalId = null
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void poll({ force: true })
        startInterval()
        return
      }

      stopInterval()
    }

    const handleFocus = () => {
      void poll({ force: true })
      startInterval()
    }

    const handleOnline = () => {
      void poll({ force: true })
      startInterval()
    }

    const handlePageShow = () => {
      void poll({ force: true })
      startInterval()
    }

    void poll({ force: true })
    startInterval()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      stopInterval()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  return null
}
