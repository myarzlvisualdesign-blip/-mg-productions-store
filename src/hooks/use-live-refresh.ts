'use client'

import { useEffect, useRef } from 'react'

interface UseLiveRefreshOptions {
  enabled?: boolean
  intervalMs?: number
  refreshOnFocus?: boolean
  refreshOnOnline?: boolean
  refreshOnVisible?: boolean
}

export function useLiveRefresh(
  refresh: () => void | Promise<void>,
  {
    enabled = true,
    intervalMs = 15000,
    refreshOnFocus = true,
    refreshOnOnline = true,
    refreshOnVisible = true,
  }: UseLiveRefreshOptions = {}
) {
  const refreshRef = useRef(refresh)

  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return
    }

    let intervalId: ReturnType<typeof setInterval> | null = null

    const canRefresh = () =>
      document.visibilityState === 'visible' &&
      (typeof navigator === 'undefined' || navigator.onLine !== false)

    const runRefresh = () => {
      if (!canRefresh()) return
      void refreshRef.current()
    }

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const startInterval = () => {
      stopInterval()
      if (!canRefresh()) return
      intervalId = setInterval(runRefresh, intervalMs)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (refreshOnVisible) {
          runRefresh()
        }
        startInterval()
        return
      }

      stopInterval()
    }

    const handleFocus = () => {
      if (refreshOnFocus) {
        runRefresh()
      }
      startInterval()
    }

    const handleOnline = () => {
      if (refreshOnOnline) {
        runRefresh()
      }
      startInterval()
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        runRefresh()
        startInterval()
      }
    }

    startInterval()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)

    if (refreshOnFocus) {
      window.addEventListener('focus', handleFocus)
    }

    if (refreshOnOnline) {
      window.addEventListener('online', handleOnline)
    }

    return () => {
      stopInterval()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)

      if (refreshOnFocus) {
        window.removeEventListener('focus', handleFocus)
      }

      if (refreshOnOnline) {
        window.removeEventListener('online', handleOnline)
      }
    }
  }, [enabled, intervalMs, refreshOnFocus, refreshOnOnline, refreshOnVisible])
}
