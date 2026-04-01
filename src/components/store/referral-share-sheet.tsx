'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────

interface ReferralShareSheetProps {
  open: boolean
  onClose: () => void
  code: string
  refereeReward: number
}

interface Platform {
  name: string
  icon: ReactNode
  bgColor: string
  getShareUrl: (text: string, url: string) => string
  isCopyOnly?: boolean
}

// ─── Official SVG Icons ────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// ─── Social Platforms ──────────────────────────────────────────────────

const platforms: Platform[] = [
  {
    name: 'WhatsApp',
    icon: <WhatsAppIcon />,
    bgColor: 'bg-[#25D366] hover:bg-[#20BD5A]',
    getShareUrl: (text, url) =>
      `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`,
  },
  {
    name: 'Facebook',
    icon: <FacebookIcon />,
    bgColor: 'bg-[#1877F2] hover:bg-[#1565D8]',
    getShareUrl: (text, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    name: 'Instagram',
    icon: <InstagramIcon />,
    bgColor: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90',
    getShareUrl: () => '',
    isCopyOnly: true,
  },
  {
    name: 'Telegram',
    icon: <TelegramIcon />,
    bgColor: 'bg-[#0088CC] hover:bg-[#0077B5]',
    getShareUrl: (text, url) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: 'X',
    icon: <XIcon />,
    bgColor: 'bg-black hover:bg-neutral-800',
    getShareUrl: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Salin Link',
    icon: <Link2 className="size-7" />,
    bgColor: 'bg-purple-600 hover:bg-purple-500',
    getShareUrl: () => '',
    isCopyOnly: true,
  },
]

// ─── Component ─────────────────────────────────────────────────────────

export default function ReferralShareSheet({ open, onClose, code, refereeReward }: ReferralShareSheetProps) {
  const [linkCopied, setLinkCopied] = useState(false)

  const referralLink = `https://mgproductionsid.com?ref=${code}`

  const shareText = `Hey! Gunakan kode referral saya ${code} di MG PRODUCTIONS untuk dapat diskon ${formatRupiah(refereeReward)} untuk pembelian Store & Travel! 🎉`

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setLinkCopied(true)
      toast.success('Link referral berhasil disalin!')
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin link')
    }
  }, [referralLink])

  const handleShare = useCallback((platform: Platform) => {
    if (platform.isCopyOnly) {
      handleCopyLink()
      return
    }

    const url = platform.getShareUrl(shareText, referralLink)
    if (!url) return

    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400')
  }, [shareText, referralLink, handleCopyLink])

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="rounded-t-2xl bg-background/95 backdrop-blur-xl border-white/10 max-h-[85vh]">
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <SheetHeader className="text-center px-4 pb-2">
          <SheetTitle className="text-lg">Bagikan Kode Referral</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Ajak teman belanja & dapatkan reward setiap transaksi!
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Referral Link Preview */}
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5">Link Referral</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-purple-300 bg-black/20 px-2.5 py-1.5 rounded-lg truncate">
                {referralLink}
              </code>
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0 h-8 px-3 gap-1.5 rounded-lg text-[10px] bg-purple-600 hover:bg-purple-500 text-white"
              >
                {linkCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {linkCopied ? 'Disalin' : 'Salin'}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5">
              Teman yang klik link ini otomatis mendapat kode referral kamu saat checkout
            </p>
          </div>

          <Separator className="bg-white/[0.04]" />

          {/* Social Media Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {platforms.map((platform) => (
              <motion.button
                key={platform.name}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare(platform)}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl ${platform.bgColor} text-white transition-all active:scale-95`}
              >
                {platform.icon}
                <span className="text-[10px] font-semibold leading-tight text-center">{platform.name}</span>
              </motion.button>
            ))}
          </div>

          <p className="text-[9px] text-muted-foreground/40 text-center leading-relaxed">
            Dengan membagikan kode referral, teman kamu akan otomatis mendapatkan diskon
            {formatRupiah(refereeReward)} saat berbelanja Store & Travel di MG PRODUCTIONS.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
