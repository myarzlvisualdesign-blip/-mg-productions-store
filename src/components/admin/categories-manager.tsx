'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Tag, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface Category {
  id: string
  name: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

// ─── Inline Edit Row ──────────────────────────────────────────────────

function EditRow({
  category,
  onSave,
  onCancel,
}: {
  category: Category
  onSave: (id: string, name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(category.name)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama kategori tidak boleh kosong')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (res.ok) {
        toast.success('Kategori berhasil diperbarui')
        onSave(category.id, name.trim())
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal memperbarui kategori')
      }
    } catch {
      toast.error('Gagal memperbarui kategori')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9 bg-white/5 border-white/[0.06] text-sm flex-1"
        autoFocus
      />
      <Button type="submit" size="sm" disabled={saving} className="h-9 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Simpan'}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-9 text-xs px-3 text-muted-foreground">
        Batal
      </Button>
    </form>
  )
}

// ─── Main Categories Manager ──────────────────────────────────────────

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories?all=true')
      if (res.ok) setCategories(await res.json())
    } catch {
      toast.error('Gagal mengambil data kategori')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        toast.success(`Kategori "${newName.trim()}" berhasil ditambahkan`)
        setNewName('')
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menambahkan kategori')
      }
    } catch {
      toast.error('Gagal menambahkan kategori')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = useCallback((_id: string, _name: string) => {
    setEditingId(null)
    fetchCategories()
  }, [fetchCategories])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`Kategori "${deleteTarget.name}" berhasil dihapus`)
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus kategori')
      }
    } catch {
      toast.error('Gagal menghapus kategori')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleToggleActive = async (category: Category) => {
    setToggling(category.id)
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !category.active }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCategories((prev) => prev.map((c) => (c.id === category.id ? updated : c)))
        toast.success(category.active ? 'Kategori dinonaktifkan' : 'Kategori diaktifkan')
      } else {
        toast.error('Gagal mengubah status kategori')
      }
    } catch {
      toast.error('Gagal mengubah status kategori')
    } finally {
      setToggling(null)
    }
  }

  const activeCount = categories.filter((c) => c.active).length

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass-card rounded-2xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Kelola Kategori Produk</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {categories.length} kategori terdaftar • {activeCount} aktif
            </p>
          </div>

          {/* Add New Category */}
          <form onSubmit={handleAdd} className="flex items-center gap-2 mb-6">
            <div className="flex-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50"
              />
            </div>
            <Button
              type="submit"
              disabled={adding || !newName.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 gap-2 shrink-0"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Tambah</span>
            </Button>
          </form>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!loading && categories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-white/[0.05] p-4 mb-4">
                <Tag className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Belum ada kategori</p>
              <p className="text-xs text-muted-foreground mt-1">
                Gunakan form di atas untuk menambahkan kategori baru
              </p>
            </div>
          )}

          {/* Categories List */}
          {!loading && categories.length > 0 && (
            <div className="space-y-1.5">
              <AnimatePresence>
                {categories.map((category, index) => {
                  const isEditing = editingId === category.id
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group ${
                        category.active
                          ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                          : 'border-white/[0.03] bg-white/[0.01] opacity-60'
                      }`}
                    >
                      {/* Order number */}
                      <div className="shrink-0 w-7 text-center">
                        <span className="text-xs font-mono text-muted-foreground/50">#{category.order}</span>
                      </div>

                      {/* Icon */}
                      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                        category.active ? 'bg-purple-500/10' : 'bg-white/[0.03]'
                      }`}>
                        <Tag className={`h-4 w-4 ${category.active ? 'text-purple-400' : 'text-muted-foreground/40'}`} />
                      </div>

                      {/* Name — editable inline */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <EditRow
                            category={category}
                            onSave={handleUpdate}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-foreground truncate">
                                {category.name}
                              </h3>
                              <span
                                className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                  category.active
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {category.active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(category)}
                            disabled={toggling === category.id}
                            className={`h-8 w-8 ${
                              category.active
                                ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10'
                            }`}
                            title={category.active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {toggling === category.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : category.active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingId(category.id)}
                            className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(category)}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Hint */}
          {!loading && categories.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-muted-foreground">
                Kategori yang digunakan oleh produk tidak dapat dihapus. Nonaktifkan untuk menyembunyikan dari storefront.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-card border-white/[0.06] bg-popover max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Yakin ingin menghapus kategori{' '}
              <span className="font-semibold text-foreground">&quot;{deleteTarget?.name}&quot;</span>?
              Kategori yang masih digunakan produk tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="text-muted-foreground hover:text-foreground border-white/[0.06]"
              disabled={deleting}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
