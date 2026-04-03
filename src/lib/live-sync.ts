'use client'

export type LiveSyncTopic =
  | 'products'
  | 'categories'
  | 'partners'
  | 'topup'
  | 'food'
  | 'travel'
  | 'destinations'
  | 'topup-banners'
  | 'chatbot-settings'
  | 'storefront-all'

const LIVE_SYNC_EVENT = 'mg-live-sync'
const LIVE_SYNC_STORAGE_KEY = 'mg-live-sync'

interface LiveSyncPayload {
  topics: LiveSyncTopic[]
  timestamp: number
}

function matchesTopic(payload: LiveSyncPayload, topics: LiveSyncTopic[]) {
  return (
    payload.topics.includes('storefront-all') ||
    topics.includes('storefront-all') ||
    payload.topics.some((topic) => topics.includes(topic))
  )
}

export function broadcastLiveSync(...topics: LiveSyncTopic[]) {
  if (typeof window === 'undefined') return

  const payload: LiveSyncPayload = {
    topics: topics.length > 0 ? topics : ['storefront-all'],
    timestamp: Date.now(),
  }

  window.dispatchEvent(new CustomEvent<LiveSyncPayload>(LIVE_SYNC_EVENT, { detail: payload }))

  try {
    window.localStorage.setItem(LIVE_SYNC_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage failures in private/incognito contexts.
  }
}

export function subscribeLiveSync(
  topics: LiveSyncTopic[],
  onSync: () => void
) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleEvent = (event: Event) => {
    const payload = (event as CustomEvent<LiveSyncPayload>).detail
    if (payload && matchesTopic(payload, topics)) {
      onSync()
    }
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== LIVE_SYNC_STORAGE_KEY || !event.newValue) return

    try {
      const payload = JSON.parse(event.newValue) as LiveSyncPayload
      if (matchesTopic(payload, topics)) {
        onSync()
      }
    } catch {
      // Ignore malformed storage payloads.
    }
  }

  window.addEventListener(LIVE_SYNC_EVENT, handleEvent as EventListener)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(LIVE_SYNC_EVENT, handleEvent as EventListener)
    window.removeEventListener('storage', handleStorage)
  }
}
