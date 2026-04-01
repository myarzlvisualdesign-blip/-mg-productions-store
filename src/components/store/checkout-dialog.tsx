'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useCartStore, type CartItem } from '@/store/cart-store'
import { formatRupiah } from '@/lib/utils'
import ReferralCodeInput from '@/components/store/referral-code-input'

interface CheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface OrderForm {
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
}

export default function CheckoutDialog({ isOpen, onClose }: CheckoutDialogProps) {
  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const clearCart = useCartStore((s) => s.clearCart)

  const [form, setForm] = useState<OrderForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
  })
  const [errors, setErrors] = useState<Partial<OrderForm>>({})
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [appliedReferralCode, setAppliedReferralCode] = useState<string | null>(null)
  const [referralDiscount, setReferralDiscount] = useState(0)

  const validate = (): boolean => {
    const newErrors: Partial<OrderForm> = {}
    if (!form.customerName.trim()) newErrors.customerName = 'Name is required'
    if (!form.customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      newErrors.customerEmail = 'Invalid email address'
    }
    if (!form.address.trim()) newErrors.address = 'Address is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item: CartItem) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          total: Math.max(0, totalPrice - referralDiscount),
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone || null,
          address: form.address,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to place order')
      }

      const data = await res.json()
      setOrderId(data.id)

      // Apply referral code after successful order
      if (appliedReferralCode && totalPrice >= 100000) {
        try {
          await fetch('/api/referral/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: appliedReferralCode,
              orderType: 'store',
              orderId: data.id,
              customerName: form.customerName,
              customerEmail: form.customerEmail,
              orderTotal: totalPrice,
            }),
          })
        } catch {
          // Referral apply failure shouldn't block the order
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (orderId) {
      clearCart()
      setOrderId(null)
      setForm({ customerName: '', customerEmail: '', customerPhone: '', address: '' })
      setErrors({})
      setSubmitError(null)
      setAppliedReferralCode(null)
      setReferralDiscount(0)
    }
    onClose()
  }

  const inputClass = (field: keyof OrderForm) =>
    `border-white/10 bg-white/5 text-sm ${errors[field] ? 'border-red-500/50' : ''}`

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/10">
        <AnimatePresence mode="wait">
          {orderId ? (
            /* Success State */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center py-8"
            >
              <DialogTitle className="sr-only">Checkout</DialogTitle>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <CheckCircle2 className="size-20 text-green-400" />
              </motion.div>
              <h2 className="mt-6 text-2xl font-bold text-foreground">
                Order Placed Successfully!
              </h2>
              <p className="mt-2 text-muted-foreground">
                Thank you for your purchase. Your order is being processed.
              </p>
              <div className="mt-4 px-4 py-2 rounded-lg glass-card border border-purple-500/20">
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="text-sm font-mono font-semibold gradient-text">{orderId}</p>
              </div>
              <Button
                onClick={handleClose}
                className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl"
              >
                Continue Shopping
              </Button>
            </motion.div>
          ) : (
            /* Form State */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="size-5 text-purple-400" />
                  Checkout
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Complete your order by filling in the details below.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">
                    Full Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="John Doe"
                    className={inputClass('customerName')}
                  />
                  {errors.customerName && (
                    <p className="text-xs text-red-400">{errors.customerName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">
                    Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    placeholder="john@example.com"
                    className={inputClass('customerEmail')}
                  />
                  {errors.customerEmail && (
                    <p className="text-xs text-red-400">{errors.customerEmail}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">
                    Phone <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className={inputClass('customerPhone')}
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm">
                    Shipping Address <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="123 Main St, City, State 12345"
                    className={inputClass('address')}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-400">{errors.address}</p>
                  )}
                </div>

                {/* Referral Code Input — only for Store products */}
                <ReferralCodeInput
                  onApplyCode={(code, discount) => {
                    setAppliedReferralCode(code)
                    setReferralDiscount(discount)
                  }}
                  onRemoveCode={() => {
                    setAppliedReferralCode(null)
                    setReferralDiscount(0)
                  }}
                  disabled={submitting}
                />

                <Separator className="bg-white/5" />

                {/* Order Summary */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Order Summary</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {items.map((item: CartItem) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-4">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="text-foreground font-medium shrink-0">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="bg-white/5" />
                  {referralDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-400">Referral Discount</span>
                      <span className="text-emerald-400 font-medium">-{formatRupiah(referralDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold gradient-text">
                      {formatRupiah(Math.max(0, totalPrice - referralDiscount))}
                    </span>
                  </div>
                </div>

                {submitError && (
                  <p className="text-sm text-red-400 text-center">{submitError}</p>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    `Pesan Sekarang — ${formatRupiah(Math.max(0, totalPrice - referralDiscount))}`
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
