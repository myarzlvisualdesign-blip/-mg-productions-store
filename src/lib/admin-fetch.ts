import { useViewStore } from '@/store/view-store'
import { useAuthStore } from '@/store/auth-store'
import { setPreferredAdminView } from '@/lib/admin-session'

function handleUnauthorized() {
  setPreferredAdminView(false)
  useAuthStore.setState({ isAuthenticated: false, username: null, isLoading: false })
  useViewStore.setState({ viewMode: 'store' })
}

export async function adminFetch(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 401) {
    handleUnauthorized()
  }

  return response
}

export async function adminFetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await adminFetch(input, init)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}
