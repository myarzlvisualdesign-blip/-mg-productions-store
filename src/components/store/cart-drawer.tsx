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
        <SheetContent side="right" className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-l border-white/5 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingBag className="size-5 text-purple-400" />
                  Shopping Cart
                </SheetTitle>
                {totalItems > 0 && (
                  <span className="flex items-center justify-center h-5 min-w-5 rounded-full bg-purple-600 text-white text-[10px] font-bold px-1.5">
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
                        className="flex gap-4 p-3 rounded-xl glass-card"
                      >
                        {/* Item Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted/20 flex items-center justify-center">
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
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {item.name}
                          </h4>
                          <p className="text-sm font-semibold gradient-text mt-0.5">
                            {formatRupiah(item.price)}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="flex items-center justify-center w-7 h-7 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                <Minus className="size-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex items-center justify-center w-7 h-7 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </ScrollArea>

              {/* Footer */}
              <SheetFooter className="px-6 pb-6 pt-4 border-t border-white/5 flex-col gap-4">
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
