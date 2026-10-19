import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Image as ImageIcon, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../context/CartContext.jsx'

export default function CartDrawer() {
  const navigate = useNavigate()
  const { cart, removeFromCart, updateQuantity, cartCount, cartSubtotal, isCartOpen, setIsCartOpen } = useCart()

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#0a2e8c]/10 text-[#0a2e8c]">
                <ShoppingBag size={18} className="stroke-[2.5]" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900 leading-none">Shopping Cart</h2>
                <span className="text-[11px] font-semibold text-slate-400">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="size-16 rounded-3xl bg-slate-50 grid place-items-center text-slate-300 mb-3">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="text-sm font-black text-slate-800">Your cart is currently empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6">
                  Explore multi-vendor listings and discover products from verified sellers.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-[#0a2e8c] text-white rounded-xl text-xs font-bold hover:bg-[#07226b] transition cursor-pointer shadow-xs"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map(({ product, quantity }) => {
                const thumb = product.images?.[0]?.url
                const price = product.salePrice !== null && product.salePrice !== undefined ? product.salePrice : product.price
                const currency = product.currency === 'USD' ? '$' : '₹'
                return (
                  <div key={product.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5">
                    {thumb ? (
                      <img src={thumb} alt={product.name} className="size-16 rounded-xl object-contain border border-slate-200 shrink-0 bg-slate-50 p-1" />
                    ) : (
                      <div className="size-16 rounded-xl bg-slate-100 text-slate-400 grid place-items-center shrink-0">
                        <ImageIcon size={20} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/products/${product.id}`}
                            onClick={() => setIsCartOpen(false)}
                            className="text-xs font-bold text-slate-900 hover:text-[#0a2e8c] line-clamp-1 transition-colors"
                          >
                            {product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {product.store && (
                          <span className="text-[10px] font-semibold text-slate-400 block truncate mt-0.5">
                            Sold by {product.store.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="size-6 rounded bg-white text-slate-600 hover:bg-slate-100 grid place-items-center cursor-pointer shadow-2xs"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-800">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="size-6 rounded bg-white text-slate-600 hover:bg-slate-100 grid place-items-center cursor-pointer shadow-2xs"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                        <span className="text-xs font-black text-slate-950">
                          {currency}{price * quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="border-t border-slate-100 p-6 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Subtotal</span>
                <span className="text-base font-black text-[#0a2e8c]">₹{cartSubtotal}</span>
              </div>
              <p className="text-[10px] text-slate-400">Shipping and multi-vendor packages calculated at checkout.</p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false)
                    navigate('/checkout')
                  }}
                  className="w-full py-3 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
