import { create } from 'zustand'

interface AuthStore {
  isAuthenticated: boolean
  username: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  username: null,
  isLoading: true,

  login: async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', username, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        set({ isAuthenticated: true, username: data.username })
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login gagal' }
      }
    } catch {
      return { success: false, error: 'Terjadi kesalahan koneksi' }
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch {
      // ignore
    }
    set({ isAuthenticated: false, username: null })
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        set({ isAuthenticated: data.authenticated, username: data.username || null })
        return data.authenticated
      }
      set({ isAuthenticated: false, username: null })
      return false
    } catch {
      set({ isAuthenticated: false, username: null })
      return false
    } finally {
      set({ isLoading: false })
    }
  },
}))
