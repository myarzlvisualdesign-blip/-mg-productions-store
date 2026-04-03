'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { useCartStore, type CartItem } from '@/store/cart-store'
import { formatRupiah } from '@/lib/utils'

export default function CartDrawer() {
  const items = useCartStore((s) => s.items)
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const totalItems = useCartStore((s) => s.totalItems())

  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    if (!open) closeCart()
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[linear-gradient(180deg,rgba(24,14,42,0.98),rgba(9,8,16,0.98))] backdrop-blur-xl border-l border-white/8 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-5 pb-0 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pt-6">
            <div className="flex min-w-0 items-center justify-between gap-3 pr-14">
              <div className="flex min-w-0 items-center gap-3">
                <SheetTitle className="flex min-w-0 items-center gap-2 text-xl font-semibold sm:text-lg">
                  <ShoppingBag className="size-5 text-purple-400" />
                  <span className="truncate">Shopping Cart</span>
                </SheetTitle>
                {totalItems > 0 && (
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white px-2 sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-[10px]">
                    {totalItems}
                  </span>
                )}
              </div>
            </div>
          </SheetHeader>

          <Separator className="mt-4 bg-white/5" />

          {/* Cart Items */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center"
              >
                <ShoppingBag className="size-12 text-purple-400/60" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add some products to get started
                </p>
              </div>
              <Button
                variant="outline"
                onClick={closeCart}
                className="mt-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6 py-4">
                <AnimatePresence mode="popLayout">
                  <div className="space-y-4">
                    {items.map((item: CartItem) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 sm:gap-4"
                      >
                        {/* Item Image */}
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/20 sm:h-16 sm:w-16 sm:rounded-lg">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="truncate text-base font-semibold text-foreground sm:text-sm">
                            {item.name}
                          </h4>
                          <p className="mt-0.5 text-lg font-semibold gradient-text sm:text-sm">
                            {formatRupiah(item.price)}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10 sm:h-7 sm:w-7 sm:rounded-md"
                              >
                                <Minus className="size-3" />
                              </button>
                              <span className="w-8 text-center text-lg font-medium sm:text-sm">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10 sm:h-7 sm:w-7 sm:rounded-md"
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-red-400/10 hover:text-red-400 sm:h-7 sm:w-7 sm:rounded-md"
                            >
                              <Trash2 className="size-4 sm:size-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </ScrollArea>

              {/* Footer */}
              <SheetFooter className="flex-col gap-4 border-t border-white/5 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6">
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({totalItems} item)</span>
                    <span className="font-semibold text-foreground">{formatRupiah(totalPrice)}</span>
                  </div>
                  {totalPrice >= 500000 ? (
                    <p className="text-xs text-green-400">
                      ✓ Gratis ongkir!
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Tambah {formatRupiah(500000 - totalPrice)} lagi untuk gratis ongkir
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => {
                    setCheckoutOpen(true)
                    closeCart()
                  }}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20"
                >
                  Checkout — {formatRupiah(totalPrice)}
                  <ArrowRight className="size-4" />
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog - controlled from here but rendered by parent or self */}
      {checkoutOpen && (
        <CheckoutDialogWrapper isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      )}
    </>
  )
}

// Inline wrapper for checkout dialog to avoid circular imports
import CheckoutDialog from './checkout-dialog'

function CheckoutDialogWrapper({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return <CheckoutDialog isOpen={isOpen} onClose={onClose} />
}
