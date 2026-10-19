import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Heart, Package, ShoppingBag, Star, Store, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCart } from '../../context/CartContext.jsx'

export default function ProductCard({
  product,
  onSelectStore,
  isFlashDeal = false,
  badgeText = '',
}) {
  const { addToCart, isInWishlist, toggleWishlist } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  if (!product) return null

  const inWishlist = isInWishlist(product.id)
  const isOutOfStock = (product.stock ?? 0) <= 0
  const isLowStock = !isOutOfStock && product.stock <= 5

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url

  const hasDiscount =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    product.salePrice < product.price

  const currentPrice = hasDiscount ? product.salePrice : product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0

  const currencySymbol = '₹'

  // Synthetic or real seller rating
  const sellerRating = product.rating > 0 ? product.rating.toFixed(1) : (product.numReviews === 0 ? 'New' : '4.8')
  const reviewCount = product.numReviews !== undefined ? product.numReviews : (product.reviewsCount || 0)

  // Flash deal claimed percentage simulation
  const claimedPercent = Math.min(92, Math.max(35, 100 - (product.stock || 10) * 3))

  function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isOutOfStock) {
      addToCart(product, 1)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1200)
    }
  }

  function handleWishlistToggle(e) {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(10,46,140,0.08)] hover:border-[#0a2e8c]/30 transition-all duration-300 overflow-hidden font-sans"
    >
      {/* ================= THUMBNAIL WRAPPER ================= */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center">
        <Link
          to={`/products/${product.id}`}
          className="size-full flex items-center justify-center p-3"
          aria-label={product.name}
        >
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className={`size-full object-contain group-hover:scale-105 transition-transform duration-300`}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300">
              <Package size={44} strokeWidth={1.5} />
              <span className="text-[11px] text-slate-400 mt-1 font-medium">No Image</span>
            </div>
          )}
        </Link>

        {/* Top Badges (Discount or Custom Pill) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-md bg-[#b93815] text-white text-[10px] font-black tracking-wide uppercase shadow-xs">
              -{discountPercent}% OFF
            </span>
          )}
          {badgeText && (
            <span className="px-2 py-0.5 rounded-md bg-[#0a2e8c] text-white text-[9px] font-black tracking-wide uppercase shadow-xs">
              {badgeText}
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 size-8 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-400 hover:text-rose-600 hover:scale-110 active:scale-90 transition-all cursor-pointer z-10"
        >
          <Heart
            size={16}
            className={inWishlist ? 'fill-rose-500 text-rose-500' : ''}
          />
        </button>

        {/* Free Express Shipping pill on thumbnail bottom */}
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 border border-slate-200/60 shadow-2xs">
            <Truck size={11} className="text-[#0a2e8c]" />
            <span>Free Shipping</span>
          </span>
        </div>
      </div>

      {/* ================= PRODUCT DETAILS ================= */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Vendor / Store Tag + Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 gap-1">
            {product.store ? (
              <Link
                to={`/store/${product.store.id}`}
                onClick={(e) => {
                  if (onSelectStore) {
                    e.preventDefault()
                    onSelectStore(product.store.id)
                  }
                }}
                className="inline-flex items-center gap-1 text-[#0a2e8c] hover:underline font-bold truncate max-w-[150px] cursor-pointer"
                title={`Shop ${product.store.name}`}
              >
                <Store size={12} className="shrink-0 text-[#0a2e8c]" />
                <span className="truncate">{product.store.name}</span>
              </Link>
            ) : (
              <span className="text-slate-400 font-semibold text-[11px]">Official Store</span>
            )}

            {/* Star Rating */}
            <div className="flex items-center gap-1 text-slate-600 shrink-0 text-[11px] font-semibold">
              <Star size={12} className="text-amber-500 fill-amber-500" />
              <span>{sellerRating}</span>
              <span className="text-slate-400 text-[10px]">({reviewCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0a2e8c] transition-colors line-clamp-2 leading-snug">
            <Link to={`/products/${product.id}`} className="no-underline">
              {product.name}
            </Link>
          </h3>
        </div>

        {/* Pricing, Stock Status & Action Button */}
        <div className="pt-3 mt-3 border-t border-slate-100 space-y-3">
          {/* Price Row */}
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-950">
                {currencySymbol}{currentPrice}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  {currencySymbol}{product.price}
                </span>
              )}
            </div>

            {hasDiscount && (
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Save {currencySymbol}{product.price - product.salePrice}
              </span>
            )}
          </div>

          {/* Flash Deal Progress Bar (if flash deal or low stock) */}
          {isFlashDeal && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Only {product.stock} left in stock</span>
                <span className="text-[#b93815]">{claimedPercent}% claimed</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-[#b93815] rounded-full transition-all duration-500"
                  style={{ width: `${claimedPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : justAdded
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-[#0a2e8c] hover:bg-[#07226b] text-white hover:shadow-md'
            }`}
          >
            {justAdded ? (
              <>
                <Check size={14} strokeWidth={3} />
                <span>Added to Cart!</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag size={14} strokeWidth={2.5} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
