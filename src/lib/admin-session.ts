const ADMIN_VIEW_KEY = 'mg-admin-view'

export function getPreferredAdminView(): boolean {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(ADMIN_VIEW_KEY) === '1'
  } catch {
    return false
  }
}

export function setPreferredAdminView(enabled: boolean) {
  if (typeof window === 'undefined') return

  try {
    if (enabled) {
      window.localStorage.setItem(ADMIN_VIEW_KEY, '1')
    } else {
      window.localStorage.removeItem(ADMIN_VIEW_KEY)
    }
  } catch {
    // Ignore storage failures in private mode or restricted environments.
  }
}
