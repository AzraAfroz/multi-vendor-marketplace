import { Link } from 'react-router-dom'
import { Heart, Image as ImageIcon, ShoppingBag, Trash2, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCart } from '../../context/CartContext.jsx'

export default function WishlistDrawer() {
  const { wishlist, removeFromWishlist, clearWishlist, moveToCart, isWishlistOpen, setIsWishlistOpen, wishlistCount } = useCart()

  if (!isWishlistOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans" role="dialog" aria-modal="true" aria-label="Wishlist">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
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
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Heart size={18} className="fill-rose-600" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900 leading-none">My Wishlist</h2>
                <span className="text-[11px] font-semibold text-slate-400">
                  {wishlistCount} {wishlistCount === 1 ? 'saved item' : 'saved items'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {wishlist.length > 0 && (
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition font-bold mr-2 cursor-pointer"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsWishlistOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close wishlist"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100">
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="size-16 rounded-3xl bg-rose-50 grid place-items-center text-rose-300 mb-3">
                  <Heart size={28} />
                </div>
                <h3 className="text-sm font-black text-slate-800">Your wishlist is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6">
                  Save items you love to revisit later or move them directly to your shopping cart.
                </p>
                <button
                  type="button"
                  onClick={() => setIsWishlistOpen(false)}
                  className="px-5 py-2.5 bg-[#0a2e8c] text-white rounded-xl text-xs font-bold hover:bg-[#07226b] transition cursor-pointer shadow-xs"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              wishlist.map((product) => {
                const thumb = product.images?.[0]?.url
                const price = product.salePrice !== null && product.salePrice !== undefined ? product.salePrice : product.price
                const isOutOfStock = (product.stock ?? 1) <= 0
                const isUnavailable = product.isActive === false || product.status === 'inactive'

                return (
                  <div key={product.id || product._id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={product.name}
                        className="size-16 rounded-xl object-contain border border-slate-200 shrink-0 bg-slate-50 p-1"
                      />
                    ) : (
                      <div className="size-16 rounded-xl bg-slate-100 text-slate-400 grid place-items-center shrink-0">
                        <ImageIcon size={20} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/products/${product.id || product._id}`}
                            onClick={() => setIsWishlistOpen(false)}
                            className="text-xs font-bold text-slate-900 hover:text-[#0a2e8c] line-clamp-1 transition-colors"
                          >
                            {product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromWishlist(product.id || product._id)}
                            className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                            title="Remove from wishlist"
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

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-black text-slate-950">
                          ₹{price}
                        </span>

                        <button
                          type="button"
                          onClick={() => moveToCart(product.id || product._id)}
                          disabled={isOutOfStock || isUnavailable}
                          className="px-3 py-1.5 rounded-lg bg-[#0a2e8c] hover:bg-[#07226b] text-white text-[11px] font-bold transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-2xs"
                        >
                          <ShoppingBag size={12} />
                          <span>Move to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
