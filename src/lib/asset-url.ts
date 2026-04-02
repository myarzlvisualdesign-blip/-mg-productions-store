export function normalizeAssetUrl(url?: string | null) {
  if (!url) return ''
  if (url.startsWith('/api/images/')) {
    return url.replace('/api/images/', '/uploads/')
  }
  return url
}
