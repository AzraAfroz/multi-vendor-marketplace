import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Filter,
  Heart,
  MessageSquare,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  ThumbsUp,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react'
import ShoppingHeader from '../../components/shop/ShoppingHeader.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import { getPublicCategories, getPublicProductById } from '../../services/catalogService.js'
import { apiErrorMessage } from '../../services/authService.js'
import { useCart } from '../../context/CartContext.jsx'
import useAuth from '../../hooks/useAuth.js'
import {
  getProductReviews,
  getMyReviewStatus,
  submitProductReview,
  toggleReviewHelpful,
  deleteProductReview,
} from '../../services/reviewService.js'

const RATING_MOODS = {
  1: 'Poor — Unsatisfactory',
  2: 'Fair — Below expectations',
  3: 'Average — Met expectations',
  4: 'Good — Highly recommended',
  5: 'Excellent — Exceeded expectations!',
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, isInWishlist, toggleWishlist } = useCart()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addedNotice, setAddedNotice] = useState(false)

  // ================= REVIEWS SYSTEM STATE =================
  const [reviewsData, setReviewsData] = useState({
    items: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    summary: {
      averageRating: 0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
  })
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewSort, setReviewSort] = useState('newest')
  const [reviewFilterRating, setReviewFilterRating] = useState('all')
  const [reviewFilterVerified, setReviewFilterVerified] = useState(false)
  const [reviewPage, setReviewPage] = useState(1)

  // Review Form state
  const [myReviewStatus, setMyReviewStatus] = useState(null)
  const [showReviewComposer, setShowReviewComposer] = useState(false)
  const [ratingInput, setRatingInput] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [titleInput, setTitleInput] = useState('')
  const [commentInput, setCommentInput] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewActionError, setReviewActionError] = useState('')
  const [reviewActionSuccess, setReviewActionSuccess] = useState('')

  // Load product & categories
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')
    setQuantity(1)
    setSelectedImageIndex(0)

    Promise.all([
      getPublicProductById(id),
      getPublicCategories({ limit: 50 }).catch(() => ({ items: [] })),
    ])
      .then(([productData, categoriesData]) => {
        if (!isMounted) return
        setProduct(productData)
        setCategories(categoriesData?.items || [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(apiErrorMessage(err))
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  // Function to load reviews with filters & pagination
  function loadReviews(page = 1) {
    if (!id) return
    setReviewsLoading(true)
    const params = { page, limit: 6, sort: reviewSort }
    if (reviewFilterRating !== 'all') params.rating = reviewFilterRating
    if (reviewFilterVerified) params.verified = 'true'

    getProductReviews(id, params)
      .then((data) => {
        setReviewsData(data)
        setReviewPage(page)
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }

  // Load reviews on filter/sort change
  useEffect(() => {
    loadReviews(1)
  }, [id, reviewSort, reviewFilterRating, reviewFilterVerified])

  // Load user review status if signed in
  useEffect(() => {
    if (user && id) {
      getMyReviewStatus(id)
        .then((res) => {
          setMyReviewStatus(res)
          if (res?.userReview) {
            setRatingInput(res.userReview.rating)
            setTitleInput(res.userReview.title)
            setCommentInput(res.userReview.comment)
          }
        })
        .catch(() => {})
    }
  }, [user, id])

  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    setSubmittingReview(true)
    setReviewActionError('')
    setReviewActionSuccess('')

    try {
      await submitProductReview(id, {
        rating: ratingInput,
        title: titleInput,
        comment: commentInput,
      })
      setReviewActionSuccess(
        myReviewStatus?.hasReviewed
          ? 'Your review has been updated successfully!'
          : 'Thank you! Your verified review has been published.'
      )
      setShowReviewComposer(false)
      loadReviews(1)
      getMyReviewStatus(id).then(setMyReviewStatus).catch(() => {})
      getPublicProductById(id).then(setProduct).catch(() => {})
    } catch (err) {
      setReviewActionError(apiErrorMessage(err) || 'Failed to submit review.')
    } finally {
      setSubmittingReview(false)
    }
  }

  async function handleToggleHelpful(reviewId) {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const updated = await toggleReviewHelpful(reviewId)
      setReviewsData((prev) => ({
        ...prev,
        items: prev.items.map((r) => (r.id === reviewId ? updated : r)),
      }))
    } catch (err) {
      // ignore
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!window.confirm('Are you sure you want to remove your review?')) return
    try {
      await deleteProductReview(reviewId)
      loadReviews(1)
      getMyReviewStatus(id).then(setMyReviewStatus).catch(() => {})
      getPublicProductById(id).then(setProduct).catch(() => {})
      setReviewActionSuccess('Your review has been removed.')
    } catch (err) {
      alert(apiErrorMessage(err) || 'Failed to delete review.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <ShoppingHeader categories={categories} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="size-10 border-3 border-[#0a2e8c] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-600">Loading product information…</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <ShoppingHeader categories={categories} />
        <div className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
          <div className="size-16 rounded-full bg-rose-50 text-rose-600 grid place-items-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h1>
          <p className="text-sm text-slate-600 mb-6">
            {error || 'The product you are looking for is either unavailable or has been deactivated.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0a2e8c] text-white rounded-xl text-sm font-bold hover:bg-[#07226b] transition shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} /> Return to Shopping
          </button>
        </div>
      </div>
    )
  }

  const inWishlist = isInWishlist(product.id)
  const isOutOfStock = (product.stock ?? 0) <= 0
  const maxStock = product.stock ?? 0

  const hasDiscount =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    product.salePrice < product.price

  const currentPrice = hasDiscount ? product.salePrice : product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0

  const images = product.images || []
  const activeImage = images[selectedImageIndex]?.url || images[0]?.url

  function handleQuantityChange(delta) {
    const next = quantity + delta
    if (next >= 1 && next <= (maxStock || 1)) {
      setQuantity(next)
    }
  }

  function handleAddToCart() {
    if (isOutOfStock) return
    addToCart(product, quantity)
    setAddedNotice(true)
    setTimeout(() => setAddedNotice(false), 3000)
  }

  const averageScore = reviewsData.summary?.averageRating || product.rating || 0
  const totalReviewsCount = reviewsData.summary?.totalReviews || product.numReviews || 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <ShoppingHeader
        categories={categories}
        onSelectCategory={(catId) => {
          if (catId === 'all') navigate('/?browse=all')
          else if (catId === 'deals') navigate('/?browse=all&sort=price_asc')
          else navigate(catId ? `/?category=${catId}` : '/')
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 flex-wrap" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#0a2e8c] font-medium">Home</Link>
          <ChevronRight size={13} className="text-slate-400" />
          {product.category ? (
            <>
              <Link to={`/?category=${product.category.id}`} className="hover:text-[#0a2e8c] font-medium">
                {product.category.name}
              </Link>
              <ChevronRight size={13} className="text-slate-400" />
            </>
          ) : null}
          <span className="text-slate-900 font-bold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Primary Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xs">
          {/* Left Column: Product Images */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-4">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="size-full object-contain mix-blend-multiply"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                  <Package size={64} strokeWidth={1.5} />
                  <span className="text-xs text-slate-400 mt-2 font-medium">No image available</span>
                </div>
              )}

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                className="absolute top-4 right-4 size-11 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-rose-500 hover:scale-105 transition-all cursor-pointer"
              >
                <Heart size={22} className={inWishlist ? 'fill-rose-500 text-rose-500' : ''} />
              </button>

              {/* Discount Tag */}
              {hasDiscount && (
                <span className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-xs">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.url || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`size-18 rounded-xl border-2 overflow-hidden bg-slate-50 shrink-0 p-1 transition cursor-pointer ${
                      selectedImageIndex === idx ? 'border-[#0a2e8c] ring-2 ring-[#0a2e8c]/15' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={img.url} alt="" className="size-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Purchase Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Vendor Information Pill with Link to Store */}
              {product.store && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-slate-900 text-xs font-semibold">
                  <Store size={14} className="text-[#0a2e8c]" />
                  <span>
                    Sold by:{' '}
                    <Link
                      to={`/store/${product.store.id}`}
                      className="text-[#0a2e8c] font-bold hover:underline"
                      title="Visit official seller storefront"
                    >
                      {product.store.name}
                    </Link>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full font-bold">
                    <ShieldCheck size={12} /> Verified Vendor
                  </span>
                </div>
              )}

              {/* Title & Brand */}
              <div>
                {product.brand && (
                  <span className="text-xs uppercase font-extrabold text-[#0a2e8c] tracking-wider block mb-1">
                    {product.brand.name}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Rating & Review Summary Line */}
                <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        className={
                          star <= Math.round(averageScore)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    {averageScore > 0 ? averageScore.toFixed(1) : 'New Product'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <a
                    href="#customer-reviews"
                    className="text-xs font-bold text-[#0a2e8c] hover:underline"
                  >
                    {totalReviewsCount} {totalReviewsCount === 1 ? 'Customer Review' : 'Customer Reviews'}
                  </a>
                </div>
              </div>

              {/* Price Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-baseline justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950">
                      ₹{currentPrice.toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <span className="text-base text-slate-400 line-through font-semibold">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  {hasDiscount && (
                    <span className="text-xs font-bold text-rose-600 block mt-1">
                      Save ₹{(product.price - product.salePrice).toFixed(2)} ({discountPercent}% discount)
                    </span>
                  )}
                </div>

                {/* Stock Indicator */}
                <div className="text-right">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                      Out of stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <Check size={14} /> In Stock ({product.stock} available)
                    </span>
                  )}
                </div>
              </div>

              {/* Short / Long Description */}
              {product.description && (
                <div className="py-2">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About this item</h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Specifications / Meta */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Category</span>
                  <span className="text-gray-800 font-bold">{product.category?.name || 'General'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Brand</span>
                  <span className="text-gray-800 font-bold">{product.brand?.name || 'Generic / Unbranded'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Currency</span>
                  <span className="text-gray-800 font-bold">INR (₹)</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Seller Verification</span>
                  <span className="text-emerald-700 font-bold">Government KYC Verified</span>
                </div>
              </div>
            </div>

            {/* Purchasing Controls */}
            <div className="mt-8 space-y-4 pt-4">
              {addedNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <Check size={16} className="text-emerald-700" /> Added {quantity} {quantity === 1 ? 'item' : 'items'} to your cart!
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity Control */}
                <div className="flex items-center border border-gray-300 rounded-xl bg-white h-12 px-2 shrink-0 justify-between sm:justify-start">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={isOutOfStock || quantity <= 1}
                    className="size-8 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={isOutOfStock || quantity >= maxStock}
                    className="size-8 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 h-12 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#0a2e8c] hover:bg-[#07226b] text-white active:scale-[0.98]'
                  }`}
                >
                  <ShoppingBag size={18} />
                  {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                </button>
              </div>

              {/* Guarantees Strip */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 text-[11px] text-gray-500 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Truck size={16} className="text-gray-400" />
                  <span>Fast Vendor Dispatch</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck size={16} className="text-gray-400" />
                  <span>Buyer Protection</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw size={16} className="text-gray-400" />
                  <span>Direct Vendor Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CUSTOMER REVIEWS & RATINGS SECTION ================= */}
        <section id="customer-reviews" className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xs space-y-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0a2e8c] uppercase tracking-wider mb-1">
                <MessageSquare size={14} /> Verified Buyer Feedback
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Customer Ratings & Reviews
              </h2>
            </div>

            <div>
              {user ? (
                <button
                  type="button"
                  onClick={() => setShowReviewComposer(!showReviewComposer)}
                  className="px-5 py-2.5 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles size={15} />
                  {myReviewStatus?.hasReviewed ? 'Edit Your Review' : 'Write a Customer Review'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
                >
                  Sign in to Review
                </button>
              )}
            </div>
          </div>

          {reviewActionSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>{reviewActionSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setReviewActionSuccess('')}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Rating Summary Scorecard & Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80">
            {/* Big Scorecard */}
            <div className="md:col-span-5 text-center md:text-left md:border-r md:border-slate-200 md:pr-8">
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-5xl font-black text-slate-950 tracking-tight">
                  {averageScore > 0 ? averageScore.toFixed(1) : '—'}
                </span>
                <span className="text-slate-400 text-lg font-bold">/ 5.0</span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={
                      star <= Math.round(averageScore)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }
                  />
                ))}
              </div>

              <p className="text-xs text-slate-600 font-medium">
                Based on <strong>{totalReviewsCount}</strong> verified customer {totalReviewsCount === 1 ? 'rating' : 'ratings'}
              </p>
            </div>

            {/* Star Distribution Progress Bars */}
            <div className="md:col-span-7 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewsData.summary?.ratingCounts?.[stars] || 0
                const percent = reviewsData.summary?.ratingPercentages?.[stars] || 0
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setReviewFilterRating(reviewFilterRating === String(stars) ? 'all' : String(stars))}
                    className="w-full flex items-center gap-3 text-xs text-slate-600 group hover:text-slate-900 cursor-pointer"
                    title={`Filter by ${stars} stars`}
                  >
                    <span className="w-12 font-bold shrink-0 text-left group-hover:underline">
                      {stars} Star
                    </span>

                    <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden relative">
                      <div
                        className="h-full bg-amber-400 group-hover:bg-[#0a2e8c] transition-all rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <span className="w-16 text-right font-medium text-slate-400 text-[11px] shrink-0">
                      {percent}% ({count})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Interactive Review Composer Form */}
          {showReviewComposer && (
            <div className="rounded-2xl bg-blue-50/50 border border-blue-200/80 p-6 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-950">
                    {myReviewStatus?.hasReviewed ? 'Update Your Review' : 'Write Your Review'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Share your experience with other shoppers. Verified purchases receive a trust badge.
                  </p>
                </div>
                {myReviewStatus?.isVerifiedBuyer && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <ShieldCheck size={14} /> Verified Buyer
                  </span>
                )}
              </div>

              {reviewActionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {reviewActionError}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* 5-Star Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Overall Rating
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="size-9 rounded-lg hover:bg-white flex items-center justify-center transition cursor-pointer"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            size={24}
                            className={`transition-colors ${
                              star <= (hoverRating || ratingInput)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {RATING_MOODS[hoverRating || ratingInput]}
                    </span>
                  </div>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Review Headline / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="e.g. Best headphones I have used in this price range!"
                    maxLength={120}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15"
                  />
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Detailed Review
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write your honest feedback on build quality, audio performance, delivery, and seller service…"
                    maxLength={3000}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15 leading-relaxed"
                  />
                  <span className="block text-right text-[11px] text-slate-400 mt-1">
                    {commentInput.length} / 3000 characters
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send size={14} />
                    {submittingReview ? 'Submitting…' : myReviewStatus?.hasReviewed ? 'Update Review' : 'Post Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewComposer(false)}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Review Filter & Sort Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0">Filter:</span>
              <button
                type="button"
                onClick={() => setReviewFilterRating('all')}
                className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 cursor-pointer ${
                  reviewFilterRating === 'all'
                    ? 'bg-[#0a2e8c] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Stars
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewFilterRating(String(s))}
                  className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 cursor-pointer ${
                    reviewFilterRating === String(s)
                      ? 'bg-[#0a2e8c] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s} ★
                </button>
              ))}
              <button
                type="button"
                onClick={() => setReviewFilterVerified(!reviewFilterVerified)}
                className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 cursor-pointer inline-flex items-center gap-1 ${
                  reviewFilterVerified
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck size={12} /> Verified Only
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
              <span>Sort:</span>
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0a2e8c] cursor-pointer"
              >
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviewsLoading ? (
              <div className="py-12 text-center">
                <div className="size-8 border-3 border-[#0a2e8c] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Loading customer reviews…</p>
              </div>
            ) : reviewsData.items.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="size-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center mx-auto mb-3">
                  <MessageSquare size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">No reviews found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  {reviewFilterRating !== 'all' || reviewFilterVerified
                    ? 'No customer reviews match your active rating filters.'
                    : 'Be the first customer to share your experience with this item!'}
                </p>
                {user ? (
                  <button
                    type="button"
                    onClick={() => setShowReviewComposer(true)}
                    className="px-5 py-2 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles size={14} /> Write the First Review
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="px-5 py-2 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Sign in to Review
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviewsData.items.map((review) => {
                  const initial = (review.user?.name || 'S').charAt(0).toUpperCase()
                  const isAuthor = user && review.user?.id === user.id
                  const reviewDate = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : ''

                  return (
                    <article key={review.id} className="py-6 first:pt-0 last:pb-0 space-y-3">
                      {/* Reviewer Header */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-gradient-to-br from-[#0a2e8c] to-blue-600 text-white font-black text-xs grid place-items-center shrink-0">
                            {initial}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">{review.user?.name}</span>
                              {review.isVerifiedPurchase && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                                  <ShieldCheck size={11} /> Verified Buyer
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{reviewDate}</span>
                          </div>
                        </div>

                        {/* Delete action for author */}
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer"
                            title="Delete your review"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      {/* Stars & Title */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                star <= review.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-200'
                              }
                            />
                          ))}
                        </div>
                        <h4 className="text-sm font-bold text-slate-950">{review.title}</h4>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {review.comment}
                      </p>

                      {/* Helpful Button */}
                      <div className="flex items-center gap-4 pt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleHelpful(review.id)}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                            review.isHelpfulByMe
                              ? 'bg-blue-50 text-[#0a2e8c] border border-blue-200'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <ThumbsUp size={13} className={review.isHelpfulByMe ? 'fill-[#0a2e8c]' : ''} />
                          <span>Helpful {review.helpfulCount > 0 ? `(${review.helpfulCount})` : ''}</span>
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {/* Pagination for reviews */}
            {reviewsData.pagination?.totalPages > 1 && (
              <div className="flex justify-center pt-6 border-t border-slate-100">
                <Pagination
                  currentPage={reviewsData.pagination.page}
                  totalPages={reviewsData.pagination.totalPages}
                  onPageChange={(page) => loadReviews(page)}
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
