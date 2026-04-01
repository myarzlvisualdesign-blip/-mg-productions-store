'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Loader2, ImageIcon, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Partner } from './partner-form'

interface PartnersTableProps {
  onEditPartner: (partner: Partner) => void
  refreshKey: number
}

export default function PartnersTable({ onEditPartner, refreshKey }: PartnersTableProps) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchPartners = useCallback(async () => {
    try {
      // Fetch all partners (including inactive) for admin view
      const res = await fetch('/api/partners?all=true')
      if (res.ok) {
        setPartners(await res.json())
      }
    } catch {
      toast.error('Gagal mengambil data mitra')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPartners()
  }, [fetchPartners, refreshKey])

  const handleDelete = async (partner: Partner) => {
    if (!confirm(`Hapus mitra "${partner.name}"? Tindakan ini tidak dapat dibatalkan.`)) return

    setDeleting(partner.id)
    try {
      const res = await fetch(`/api/partners/${partner.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Mitra berhasil dihapus')
        setPartners((prev) => prev.filter((p) => p.id !== partner.id))
      } else {
        toast.error('Gagal menghapus mitra')
      }
    } catch {
      toast.error('Gagal menghapus mitra')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (partner: Partner) => {
    setToggling(partner.id)
    try {
      const res = await fetch(`/api/partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !partner.active }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPartners((prev) => prev.map((p) => (p.id === partner.id ? updated : p)))
        toast.success(partner.active ? 'Mitra dinonaktifkan' : 'Mitra diaktifkan')
      } else {
        toast.error('Gagal mengubah status mitra')
      }
    } catch {
      toast.error('Gagal mengubah status mitra')
    } finally {
      setToggling(null)
    }
  }

  const filtered = partners.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card rounded-2xl p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Kelola Mitra</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {partners.length} mitra terdaftar • {partners.filter((p) => p.active).length} aktif
            </p>
          </div>
          <Button
            onClick={() => onEditPartner({ id: '__new__', name: '', description: '', image: '', link: '', order: partners.length, active: true, createdAt: '', updatedAt: '' } as Partner)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Tambah Mitra
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari mitra..."
            className="pl-10 h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-white/[0.05] p-4 mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {search ? 'Tidak ada mitra yang cocok' : 'Belum ada mitra terdaftar'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? 'Coba kata kunci lain' : 'Klik "Tambah Mitra" untuk memulai'}
            </p>
          </div>
        )}

        {/* Partners List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            <AnimatePresence>
              {filtered.map((partner, index) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group ${
                    partner.active
                      ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                      : 'border-white/[0.03] bg-white/[0.01] opacity-60'
                  }`}
                >
                  {/* Order number */}
                  <div className="shrink-0 w-8 text-center">
                    <span className="text-xs font-mono text-muted-foreground/60">#{partner.order}</span>
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden bg-muted/20 border border-white/[0.06]">
                    <img
                      src={partner.image}
                      alt={partner.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-4 h-4 text-purple-400/40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>'
                      }}
                    />
                    {!partner.active && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <EyeOff className="h-4 w-4 text-white/60" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {partner.name}
                      </h3>
                      <span
                        className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          partner.active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {partner.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    {partner.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {partner.description}
                      </p>
                    )}
                    {partner.link && (
                      <a
                        href={partner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-purple-400/70 hover:text-purple-300 mt-0.5 transition-colors"
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span className="truncate max-w-[180px]">{partner.link}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(partner)}
                      disabled={toggling === partner.id}
                      className={`h-8 w-8 ${
                        partner.active
                          ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
                          : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10'
                      }`}
                      title={partner.active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {toggling === partner.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : partner.active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditPartner(partner)}
                      className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(partner)}
                      disabled={deleting === partner.id}
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      title="Hapus"
                    >
                      {deleting === partner.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
