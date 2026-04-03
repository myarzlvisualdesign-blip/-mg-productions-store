'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Loader2, Upload, ImagePlus, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch'
import { broadcastLiveSync } from '@/lib/live-sync'

// ─── Types ─────────────────────────────────────────────────────────────

interface ChatbotConfig {
  id: string
  name: string
  avatar: string
  welcomeMessage: string
  systemPrompt: string
  enabled: boolean
}

// ─── Component ─────────────────────────────────────────────────────────

export default function ChatbotSettings() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [imgError, setImgError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Fetch settings on mount ────────────────────────────────────────
  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await adminFetchJson<Partial<ChatbotConfig>>('/api/chatbot/settings')
        setConfig({
          id: data.id || '',
          name: data.name || 'MG Assistant',
          avatar: data.avatar || '',
          welcomeMessage: data.welcomeMessage || '',
          systemPrompt: data.systemPrompt || '',
          enabled: data.enabled ?? true,
        })
      } catch {
        toast.error('Gagal memuat pengaturan chatbot')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // ─── Handle avatar upload ───────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'chatbot')

      const res = await adminFetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload gagal' }))
        throw new Error(err.error || 'Upload gagal')
      }

      const { url } = await res.json()
      setConfig((prev) => prev ? { ...prev, avatar: url } : prev)
      setImgError(false)
      toast.success('Foto berhasil diupload!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengupload foto')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ─── Remove avatar ──────────────────────────────────────────────────
  const handleRemoveAvatar = () => {
    setConfig((prev) => prev ? { ...prev, avatar: '' } : prev)
    setImgError(false)
    toast.success('Foto berhasil dihapus')
  }

  // ─── Save settings ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      const res = await adminFetch('/api/chatbot/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          avatar: config.avatar,
          welcomeMessage: config.welcomeMessage,
          systemPrompt: config.systemPrompt,
          enabled: config.enabled,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal menyimpan' }))
        throw new Error(err.error || 'Gagal menyimpan')
      }

      broadcastLiveSync('chatbot-settings')
      toast.success('Pengaturan chatbot berhasil disimpan!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  // ─── Loading skeleton ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-white/5" />
        <div className="h-4 w-96 rounded-lg bg-white/5" />
        <div className="h-32 w-32 rounded-2xl bg-white/5" />
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-white/5" />
          <div className="h-10 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Gagal memuat pengaturan chatbot</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold">
          AI <span className="gradient-text">Chatbot</span> Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola tampilan dan perilaku asisten AI untuk pelanggan
        </p>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* ─── Enable/Disable Toggle ───────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-400/10 flex items-center justify-center">
            {config.enabled ? (
              <Eye className="w-4 h-4 text-purple-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Status Chatbot</p>
            <p className="text-xs text-muted-foreground">
              {config.enabled ? 'Chatbot aktif dan terlihat oleh pelanggan' : 'Chatbot disembunyikan dari pelanggan'}
            </p>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(checked) => setConfig((prev) => prev ? { ...prev, enabled: checked } : prev)}
        />
      </div>

      {/* ─── Avatar Section ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Foto Avatar</Label>
        <p className="text-xs text-muted-foreground">Upload foto untuk avatar chatbot. Rekomendasi: 200x200px, JPG/PNG.</p>

        <div className="flex items-center gap-4">
          {/* Avatar Preview */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/[0.06] bg-muted/10">
              {config.avatar && !imgError ? (
                <img
                  src={config.avatar}
                  alt="Chatbot Avatar"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">MG</span>
                </div>
              )}
            </div>
            {/* Overlay buttons */}
            {config.avatar && !imgError && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Ganti foto"
                >
                  <Upload className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={handleRemoveAvatar}
                  className="w-8 h-8 rounded-lg bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center transition-colors"
                  aria-label="Hapus foto"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2 border-purple-500/20 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 rounded-xl"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
              {config.avatar ? 'Ganti Foto' : 'Upload Foto'}
            </Button>
            {config.avatar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                className="gap-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-xl text-xs"
              >
                <Trash2 className="w-3 h-3" />
                Hapus Foto
              </Button>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleAvatarUpload}
          className="hidden"
        />
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* ─── Bot Name ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="bot-name" className="text-sm font-medium">Nama Bot</Label>
        <Input
          id="bot-name"
          value={config.name}
          onChange={(e) => setConfig((prev) => prev ? { ...prev, name: e.target.value } : prev)}
          placeholder="MG Assistant"
          className="bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl h-10"
          maxLength={30}
        />
        <p className="text-xs text-muted-foreground/60">Maksimal 30 karakter</p>
      </div>

      {/* ─── Welcome Message ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="welcome-msg" className="text-sm font-medium">Pesan Selamat Datang</Label>
        <Textarea
          id="welcome-msg"
          value={config.welcomeMessage}
          onChange={(e) => setConfig((prev) => prev ? { ...prev, welcomeMessage: e.target.value } : prev)}
          placeholder="Halo! 👋 Saya MG Assistant. Ada yang bisa saya bantu?"
          className="bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl min-h-[80px] resize-none"
          maxLength={200}
          rows={3}
        />
        <p className="text-xs text-muted-foreground/60">{config.welcomeMessage.length}/200 karakter</p>
      </div>

      {/* ─── System Prompt (Advanced) ────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">System Prompt</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Instruksi perilaku AI (advanced)</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
          >
            {showSystemPrompt ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showSystemPrompt ? 'Sembunyikan' : 'Tampilkan'}
          </Button>
        </div>

        {showSystemPrompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig((prev) => prev ? { ...prev, systemPrompt: e.target.value } : prev)}
              className="bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl min-h-[120px] resize-none font-mono text-xs"
              maxLength={1000}
              rows={5}
            />
            <p className="text-xs text-muted-foreground/60 mt-1">
              {config.systemPrompt.length}/1000 karakter
            </p>
            <div className="mt-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-[11px] text-amber-400/80">
                ⚠️ Perubahan system prompt akan langsung mempengaruhi perilaku AI saat ini. Pastikan instruksi jelas dan sesuai.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* ─── Save Button ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/25 rounded-xl px-6"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>

      {/* ─── Preview Card ────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-3">Preview</p>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
          {/* Avatar Preview */}
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
            {config.avatar && !imgError ? (
              <img src={config.avatar} alt={config.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                <span className="text-xs font-bold text-white">MG</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">{config.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{config.welcomeMessage}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
