import { useViewStore } from '@/store/view-store'
import { useAuthStore } from '@/store/auth-store'

function handleUnauthorized() {
  useAuthStore.setState({ isAuthenticated: false, username: null, isLoading: false })
}

const RETRY_DELAY_MS = 350
const REQUEST_TIMEOUT_MS = 12000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function adminFetch(input: string, init?: RequestInit) {
  const method = (init?.method ?? 'GET').toUpperCase()
  const maxAttempts = method === 'GET' ? 3 : 1
  let lastError: unknown = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(input, {
        ...init,
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          ...(init?.headers ?? {}),
        },
      })

      if (response.status === 401) {
        handleUnauthorized()
      }

      if (response.ok || response.status === 401 || response.status < 500 || attempt === maxAttempts) {
        return response
      }
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts) {
        throw error
      }
    } finally {
      clearTimeout(timeout)
    }

    await sleep(RETRY_DELAY_MS * attempt)
  }

  throw lastError instanceof Error ? lastError : new Error('Request admin gagal')
}

export async function adminFetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await adminFetch(input, init)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}
