export type ServiceCategory = 'topup' | 'food' | 'travel'

export function normalizeExternalLink(link?: string | null): string | null {
  const trimmed = link?.trim()

  if (!trimmed) {
    return null
  }

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(normalized)

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

export function buildServiceOrderMessage(category: ServiceCategory, title: string) {
  const categoryLabel = {
    topup: 'Top Up',
    food: 'Food',
    travel: 'Travel',
  }[category]

  return `Saya ingin order layanan ${categoryLabel}: ${title}`
}
