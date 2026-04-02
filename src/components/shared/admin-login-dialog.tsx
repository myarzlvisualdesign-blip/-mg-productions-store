'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setPreferredAdminView } from '@/lib/admin-session'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth-store'
import { useViewStore } from '@/store/view-store'

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
}

export default function AdminLoginDialog({ open, onClose }: AdminLoginDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = useAuthStore((s) => s.login)
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi')
      return
    }

    setLoading(true)
    const result = await login(username, password)

    if (result.success) {
      await checkAuth()
      setPreferredAdminView(true)
      const { setViewMode } = useViewStore.getState()
      setViewMode('admin')
      setLoading(false)
      setError('')
      setUsername('')
      setPassword('')
      onClose()
    } else {
      setLoading(false)
      setError(result.error || 'Login gagal')
    }
  }

  const handleClose = () => {
    if (!loading) {
      // Jika belum login, kembalikan ke store view
      if (!isAuthenticated) {
        const { setViewMode } = useViewStore.getState()
        setViewMode('store')
      }
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              {/* Lock Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center mb-4"
              >
                <Lock className="size-7 text-purple-400" />
              </motion.div>

              <DialogTitle className="text-xl font-bold text-foreground">
                Admin Login
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Masuk untuk mengakses panel admin MG PRODUCTIONS
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="text-sm font-medium text-foreground">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="pl-10 h-11 border-white/10 bg-white/5 text-sm placeholder:text-muted-foreground focus:border-purple-500/50"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="pl-10 pr-10 h-11 border-white/10 bg-white/5 text-sm placeholder:text-muted-foreground focus:border-purple-500/50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -5, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="size-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Memverifikasi...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="size-4" />
                  Masuk ke Admin
                </span>
              )}
            </Button>

            {/* Hint */}
            <p className="text-center text-xs text-muted-foreground/60">
              Akses admin hanya untuk pengelola toko
            </p>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
