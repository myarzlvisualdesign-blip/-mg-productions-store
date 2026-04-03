'use client'

import { ExternalLink, ShoppingCart } from 'lucide-react'
import { buildServiceOrderMessage, normalizeExternalLink, type ServiceCategory } from '@/lib/service-card-action'

interface ServiceActionButtonProps {
  link?: string | null
  title: string
  category: ServiceCategory
  onVisit: (link: string, title: string) => void
  className: string
}

export default function ServiceActionButton({
  link,
  title,
  category,
  onVisit,
  className,
}: ServiceActionButtonProps) {
  const normalizedLink = normalizeExternalLink(link)
  const hasLink = normalizedLink !== null

  const handleClick = () => {
    if (normalizedLink) {
      onVisit(normalizedLink, title)
      return
    }

    window.dispatchEvent(
      new CustomEvent('mg-service-order', {
        detail: {
          message: buildServiceOrderMessage(category, title),
        },
      })
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {hasLink ? <ExternalLink className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
      <span>{hasLink ? 'Visit' : 'Order'}</span>
    </button>
  )
}
