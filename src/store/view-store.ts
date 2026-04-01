import { create } from 'zustand'

type ViewMode = 'store' | 'admin'
type AdminTab = 'overview' | 'orders' | 'inventory' | 'products' | 'categories' | 'partners' | 'topup' | 'food' | 'travel' | 'destinations' | 'topup-banners' | 'chatbot' | 'referral'

interface ViewStore {
  viewMode: ViewMode
  adminTab: AdminTab
  setViewMode: (mode: ViewMode) => void
  setAdminTab: (tab: AdminTab) => void
  toggleView: () => void
}

export const useViewStore = create<ViewStore>((set, get) => ({
  viewMode: 'store',
  adminTab: 'overview',
  setViewMode: (mode) => set({ viewMode: mode }),
  setAdminTab: (tab) => set({ adminTab: tab }),
  toggleView: () =>
    set((state) => ({
      viewMode: state.viewMode === 'store' ? 'admin' : 'store',
    })),
}))
