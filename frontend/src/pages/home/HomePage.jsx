import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  ArrowUp,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Flame,
  Grid,
  Heart,
  HelpCircle,
  Layers,
  List,
  Lock,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import ShoppingHeader from '../../components/shop/ShoppingHeader.jsx'
import ProductCard from '../../components/shop/ProductCard.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import {
  getPublicBrands,
  getPublicCategories,
  getPublicProducts,
  getPublicStores,
} from '../../services/catalogService.js'
import { apiErrorMessage } from '../../services/authService.js'
import useAuth from '../../hooks/useAuth.js'

// Curated Category Icons & Images for Stitch Directory
const CATEGORY_SHOWCASE = [
  {
    name: 'Electronics',
    slug: 'mobiles-electronics',
    count: '3,120+ items',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fashion & Apparel',
    slug: 'fashion-apparel',
    count: '4,820+ items',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Home & Living',
    slug: 'home-kitchen',
    count: '2,150+ items',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Beauty & Wellness',
    slug: 'beauty-wellness',
    count: '980+ items',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sports & Fitness',
    slug: 'fitness-sports',
    count: '620+ items',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Toys & Hobbies',
    slug: 'toys-games-hobbies',
    count: '890+ items',
    image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&auto=format&fit=crop&q=80',
  },
]

// Official Brand Showcase Pills
const FEATURED_BRANDS = [
  { name: 'Anker Quantum', initial: 'AQ', slug: 'anker', verified: true },
  { name: 'Sony Official Store', initial: 'SO', slug: 'sony', verified: true },
  { name: 'Nike Authentics', initial: 'NA', slug: 'nike', verified: true },
  { name: 'Logitech Hub', initial: 'LH', slug: 'logitech', verified: true },
  { name: 'Dyson Direct', initial: 'DD', slug: 'dyson', verified: true },
  { name: 'Apple Certified', initial: 'AC', slug: 'apple', verified: true },
]

export default function HomePage({ defaultBrowseAll = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const { user } = useAuth()

  // Detect dedicated products routes
  const isProductsRoute = location.pathname === '/products' || location.pathname === '/catalog' || location.pathname === '/shop'

  // URL state
  const browseParam = searchParams.get('browse') || (defaultBrowseAll || isProductsRoute ? 'all' : '')
  const selectedCategory = searchParams.get('category') || ''
  const selectedBrand = searchParams.get('brand') || ''
  const selectedStore = searchParams.get('store') || ''
  const searchQuery = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'popular'
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1)

  // Data state
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [stores, setStores] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [activeTrendingTab, setActiveTrendingTab] = useState('trending') // trending | best_sellers | new | top_rated
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)

  // Countdown timer for Flash Deals (Ends in 06 h : 24 m : 32 s)
  const [countdown, setCountdown] = useState({ hours: 6, minutes: 24, seconds: 32 })

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 6, minutes: 24, seconds: 32 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Sync search input if URL changes
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // Load catalog taxonomies
  function loadTaxonomies() {
    Promise.all([
      getPublicCategories({ limit: 50 }).catch(() => ({ items: [] })),
      getPublicBrands({ limit: 50 }).catch(() => ({ items: [] })),
      getPublicStores({ limit: 50 }).catch(() => ({ items: [] })),
    ]).then(([catData, brandData, storeData]) => {
      setCategories(catData?.items || [])
      setBrands(brandData?.items || [])
      setStores(storeData?.items || [])
    })
  }

  useEffect(() => {
    loadTaxonomies()
  }, [])

  // Load products based on URL parameters
  function loadProducts(pageToLoad = currentPage) {
    setLoading(true)
    setError('')

    const params = {
      sort,
      limit: 12,
      page: pageToLoad,
    }
    if (selectedCategory) params.category = selectedCategory
    if (selectedBrand) params.brand = selectedBrand
    if (selectedStore) params.store = selectedStore
    if (searchQuery.trim()) params.q = searchQuery.trim()

    getPublicProducts(params)
      .then((data) => {
        setProducts(data?.items || [])
        if (data?.pagination) {
          setPagination(data.pagination)
        }
      })
      .catch((err) => {
        setError(apiErrorMessage(err))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadProducts(currentPage)
  }, [selectedCategory, selectedBrand, selectedStore, searchQuery, sort, currentPage])

  // Parameter helpers
  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    next.delete('page')
    setSearchParams(next)
  }

  function handleSearchSubmit() {
    updateParam('q', searchInput.trim())
  }

  function handleSelectCategory(catId) {
    const next = new URLSearchParams(searchParams)
    if (catId === 'all') {
      next.delete('category')
      next.set('browse', 'all')
    } else if (catId === 'deals') {
      next.delete('category')
      next.set('browse', 'all')
      next.set('sort', 'price_asc')
    } else if (catId) {
      const found = categories.find((c) => (c.id || c._id) === catId || c.slug === catId)
      const targetId = found ? (found.id || found._id) : catId
      next.delete('browse')
      next.set('category', targetId)
    } else {
      next.delete('category')
      next.delete('browse')
    }
    next.delete('page')
    setSearchParams(next)
  }

  function handleSelectBrand(brandSlugOrId) {
    const next = new URLSearchParams(searchParams)
    const found = brands.find((b) => (b.id || b._id) === brandSlugOrId || b.slug === brandSlugOrId || b.name?.toLowerCase().includes(String(brandSlugOrId).toLowerCase()))
    if (found) {
      next.delete('browse')
      next.set('brand', found.id || found._id)
    } else {
      next.set('q', brandSlugOrId)
    }
    next.delete('page')
    setSearchParams(next)
  }

  function handlePageChange(newPage) {
    const next = new URLSearchParams(searchParams)
    if (newPage > 1) {
      next.set('page', String(newPage))
    } else {
      next.delete('page')
    }
    setSearchParams(next)
    window.scrollTo({ top: 380, behavior: 'smooth' })
  }

  function clearAllFilters() {
    setSearchInput('')
    setPriceRange({ min: '', max: '' })
    const next = new URLSearchParams()
    next.set('browse', 'all')
    setSearchParams(next)
  }

  const isBrowsingOrFiltering = Boolean(
    browseParam === 'all' ||
    defaultBrowseAll ||
    isProductsRoute ||
    selectedCategory ||
    selectedBrand ||
    selectedStore ||
    searchQuery ||
    priceRange.min !== '' ||
    priceRange.max !== ''
  )

  // Label names for active filter tags
  const activeCategoryName = categories.find((c) => (c.id || c._id) === selectedCategory)?.name
  const activeBrandName = brands.find((b) => (b.id || b._id) === selectedBrand)?.name
  const activeStore = stores.find((s) => (s.id || s._id) === selectedStore)
  const activeStoreName = activeStore?.name

  // Filter products by client-side price range
  const displayedProducts = useMemo(() => {
    return products.filter((item) => {
      const price = item.salePrice ?? item.price
      if (priceRange.min !== '' && price < Number(priceRange.min)) return false
      if (priceRange.max !== '' && price > Number(priceRange.max)) return false
      return true
    })
  }, [products, priceRange])

  // Partition products for Flash Deals and Trending
  const flashDealProducts = useMemo(() => {
    return products.slice(0, 4)
  }, [products])

  const trendingProducts = useMemo(() => {
    if (!products || products.length === 0) return []
    const cloned = [...products]
    if (activeTrendingTab === 'best_sellers') {
      return cloned.sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, 8)
    }
    if (activeTrendingTab === 'new') {
      return cloned.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 8)
    }
    if (activeTrendingTab === 'top_rated') {
      return cloned.sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 8)
    }
    return cloned.slice(0, 8)
  }, [products, activeTrendingTab])

  function handleNewsletterSubmit(e) {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setNewsletterSubscribed(true)
    setNewsletterEmail('')
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-[#0a2e8c]/15 selection:text-[#0a2e8c]">
      {/* ================= GLOBAL SHOPPING HEADER ================= */}
      <ShoppingHeader
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        isBrowsing={isBrowsingOrFiltering}
      />

      {/* ================= CONDITIONAL: FULL STITCH HOMEPAGE vs. SEARCH / FILTER CATALOG ================= */}
      {!isBrowsingOrFiltering ? (
        /* ================= 1. FULL STITCH HOMEPAGE (MOCKUP 1) ================= */
        <main className="flex-1 space-y-12 pb-16">
          {/* ================= HERO SHOWCASE ================= */}
          <section className="bg-white border-b border-slate-200/80 pt-8 pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left Hero Column */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="lg:col-span-7 space-y-6"
                >
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a2e8c]/8 border border-[#0a2e8c]/20 text-[#0a2e8c] text-xs font-black tracking-wide">
                    <ShieldCheck size={14} className="stroke-[2.5]" />
                    <span>VERIFIED MULTI-VENDOR PLATFORM</span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.08]">
                    Next-Gen Tech &amp;{' '}
                    <span className="bg-gradient-to-r from-[#0a2e8c] via-[#1d4ed8] to-[#0284c7] bg-clip-text text-transparent">
                      Premium Lifestyle
                    </span>{' '}
                    Deals
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                    Discover vetted products from over 2,800+ certified independent brands &amp; global vendors.
                    Guaranteed logistics, unified multi-vendor checkout.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('all')}
                      className="px-6 py-3.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-sm font-extrabold transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Explore All Products &amp; Deals</span>
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const storesSection = document.getElementById('vendor-hubs-section')
                        if (storesSection) storesSection.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Store size={16} className="text-[#0a2e8c]" />
                      <span>Browse Verified Vendors</span>
                    </button>
                  </div>

                  {/* Hero Metric Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-slate-950">2,800+</div>
                      <div className="text-[11px] font-bold text-slate-500 mt-0.5">Vetted Brands</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-[#0a2e8c]">99.4%</div>
                      <div className="text-[11px] font-bold text-slate-500 mt-0.5">On-Time Fulfillment</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-[#b93815]">Flash Deals</div>
                      <div className="text-[11px] font-bold text-slate-500 mt-0.5">Up to 60% Off</div>
                    </div>
                  </div>
                </motion.div>

                {/* Right Hero Image Spotlight Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="lg:col-span-5 relative"
                >
                  <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-gradient-to-br from-slate-100 to-slate-200 aspect-[4/3] sm:aspect-[16/11]">
                    <img
                      src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80"
                      alt="Featured Tech Showcase"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Spotlight Floating Pill */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/60 shadow-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#0a2e8c] text-white flex items-center justify-center font-black text-xs shrink-0">
                          PRO
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold text-[#0a2e8c] tracking-wider uppercase block">
                            Featured Vendor Spotlight
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate block">
                            Sony Pro Audio Division (Official Flagship)
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/products/6ace1e74fb92fe89c83dc63d"
                        className="px-3 py-1.5 rounded-lg bg-[#0a2e8c] text-white text-xs font-bold shrink-0 hover:bg-[#07226b] transition"
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Guarantees Strip (4 Trust Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-[#0a2e8c] shadow-2xs shrink-0">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Free Express Shipping</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">On qualifying orders over $50</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-[#0a2e8c] shadow-2xs shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Verified Multi-Vendor Quality</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Certified authentic from vetted sellers</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-[#0a2e8c] shadow-2xs shrink-0">
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">7-Day Easy Returns</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Free pre-printed return labels</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-white border border-slate-200 grid place-items-center text-[#0a2e8c] shadow-2xs shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">24/7 Buyer Protection</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Full escrow payment protection warranty</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= 2. SHOP BY CATEGORY (CIRCULAR CARDS) ================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0a2e8c] block mb-1">
                  MARKETPLACE DIRECTORY
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  Shop by Category
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className="text-xs font-bold text-[#0a2e8c] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Categories</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {CATEGORY_SHOWCASE.map((cat, idx) => {
                const matchedCat = categories.find((c) => c.slug === cat.slug)
                return (
                  <motion.button
                    key={cat.name}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    onClick={() => handleSelectCategory(matchedCat?.id || matchedCat?._id || cat.slug)}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#0a2e8c] hover:shadow-md transition-all text-center group cursor-pointer flex flex-col items-center"
                  >
                    <div className="size-20 sm:size-24 rounded-2xl overflow-hidden bg-slate-100 mb-3 relative group-hover:scale-105 transition-transform duration-300">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#0a2e8c] transition-colors leading-tight line-clamp-1">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">{cat.count}</span>
                  </motion.button>
                )
              })}
            </div>
          </section>

          {/* ================= 3. FEATURED OFFICIAL BRAND STORES ================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-[#0a2e8c]" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Featured Official Brand Stores
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">100% Guaranteed Official Stock &amp; Warranties</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {FEATURED_BRANDS.map((b) => (
                <button
                  key={b.name}
                  onClick={() => handleSelectBrand(b.slug || b.name)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-[#0a2e8c] hover:bg-slate-50 transition cursor-pointer text-left group"
                >
                  <span className="size-9 rounded-lg bg-[#0a2e8c]/10 text-[#0a2e8c] font-black text-xs grid place-items-center shrink-0 group-hover:bg-[#0a2e8c] group-hover:text-white transition">
                    {b.initial}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#0a2e8c] block truncate">
                      {b.name}
                    </span>
                    <span className="text-[10px] font-semibold text-[#0a2e8c] flex items-center gap-0.5">
                      Visit Storefront &rarr;
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ================= 4. FLASH DEALS WITH COUNTDOWN TIMER ================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-[#fff5f2] via-white to-white p-6 sm:p-8 rounded-3xl border border-rose-200/70 shadow-sm space-y-6">
              {/* Header with Countdown Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-[#b93815] text-white flex items-center justify-center shadow-md shrink-0">
                    <Flame size={22} className="fill-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#b93815]">
                      LIMITED QUANTITY DROP
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      Flash Deals
                    </h2>
                  </div>
                </div>

                {/* Countdown Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-rose-200 shadow-2xs text-xs font-black text-[#b93815]">
                    <Clock size={15} />
                    <span>Ends in:</span>
                    <span className="font-mono bg-rose-50 px-1.5 py-0.5 rounded text-rose-900">
                      {String(countdown.hours).padStart(2, '0')}h
                    </span>
                    :
                    <span className="font-mono bg-rose-50 px-1.5 py-0.5 rounded text-rose-900">
                      {String(countdown.minutes).padStart(2, '0')}m
                    </span>
                    :
                    <span className="font-mono bg-rose-50 px-1.5 py-0.5 rounded text-rose-900">
                      {String(countdown.seconds).padStart(2, '0')}s
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateParam('sort', 'price_asc')}
                    className="text-xs font-bold text-[#b93815] hover:underline hidden sm:block"
                  >
                    See all 48 Deals &rarr;
                  </button>
                </div>
              </div>

              {/* Flash Deals 4-Card Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-80 rounded-2xl animate-shimmer border border-slate-200" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {flashDealProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFlashDeal={true}
                      badgeText="HOT DEAL"
                      onSelectStore={(stId) => updateParam('store', stId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ================= 5. CURATED SELECTION: TRENDING MARKETPLACE ITEMS ================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0a2e8c] block mb-1">
                  CURATED SELECTION
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  Trending Marketplace Items
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200 overflow-x-auto no-scrollbar">
                {[
                  { id: 'trending', label: 'All Trending' },
                  { id: 'best_sellers', label: 'Best Sellers' },
                  { id: 'new', label: 'New Arrivals' },
                  { id: 'top_rated', label: 'Top Rated Vendors' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTrendingTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTrendingTab === tab.id
                        ? 'bg-[#0a2e8c] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-80 rounded-2xl animate-shimmer border border-slate-200" />
                ))}
              </div>
            ) : trendingProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    badgeText={idx === 0 ? 'BESTSELLER' : idx === 1 ? 'ECO CHOICE' : ''}
                    onSelectStore={(stId) => updateParam('store', stId)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <Package size={32} className="mx-auto text-slate-400 mb-2" />
                <h3 className="text-base font-bold text-slate-900">Connecting to Marketplace Catalog</h3>
                <p className="text-xs text-slate-500 mt-1">Please wait a moment while verified items sync.</p>
              </div>
            )}

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className="px-6 py-3 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <span>View All {products.length || 'Marketplace'} Products with Filter Sidebar</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </section>

          {/* ================= 6. APPROVED INDEPENDENT BRAND HUBS ================= */}
          <section id="vendor-hubs-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0a2e8c] block mb-1">
                  MARKETPLACE SELLER SPOTLIGHT
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  Approved Independent Brand Hubs
                </h2>
              </div>
              <Link
                to="/vendor/onboarding"
                className="text-xs font-bold text-[#0a2e8c] hover:underline hidden sm:block"
              >
                Apply to Sell on ShopVerse &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: 'hub-1',
                  name: 'Aura Home & Kitchen',
                  badge: 'Top Rated Seller',
                  rating: '4.9 ★',
                  feedback: '99.2%',
                  response: '< 24h',
                  images: [
                    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300&auto=format&fit=crop&q=80',
                  ],
                },
                {
                  id: 'hub-2',
                  name: 'CyberPulse Electronics',
                  badge: 'Certified Distributor',
                  rating: '4.8 ★',
                  feedback: '98.7%',
                  response: '2.1h',
                  images: [
                    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
                  ],
                },
                {
                  id: 'hub-3',
                  name: 'LuxeWear Atelier',
                  badge: 'Official Brand Store',
                  rating: '4.9 ★',
                  feedback: '99.6%',
                  response: '100%',
                  images: [
                    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&auto=format&fit=crop&q=80',
                  ],
                },
              ].map((hub) => (
                <div
                  key={hub.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 hover:border-[#0a2e8c] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{hub.name}</h3>
                      <span className="inline-block mt-0.5 text-[10px] font-extrabold px-2 py-0.5 bg-blue-50 text-[#0a2e8c] rounded-md">
                        {hub.badge}
                      </span>
                    </div>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-100 text-xs">
                    <div>
                      <div className="font-extrabold text-slate-950">{hub.rating}</div>
                      <div className="text-[10px] text-slate-400">1.4k Reviews</div>
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-950">{hub.feedback}</div>
                      <div className="text-[10px] text-slate-400">Positive Feedback</div>
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-950">{hub.response}</div>
                      <div className="text-[10px] text-slate-400">Avg Reply Time</div>
                    </div>
                  </div>

                  {/* 3 Image previews */}
                  <div className="grid grid-cols-3 gap-2">
                    {hub.images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                        <img src={img} alt="Product preview" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => updateParam('q', hub.name)}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#0a2e8c] hover:text-white text-[#0a2e8c] border border-slate-200 text-xs font-bold transition text-center cursor-pointer"
                  >
                    Visit {hub.name} Store
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ================= 7. NEWSLETTER DROP ALERTS ================= */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0a2e8c] via-[#082470] to-[#04123b] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
              <div className="space-y-2 max-w-lg">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                  DIRECT DISPATCH DROPS
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  Get Exclusive Drop Alerts &amp; Secret Vendor Coupons
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Join over 180,000 smart shoppers receiving weekly wholesale drops, flash discount notifications, and
                  early-certified merchant previews.
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row gap-2">
                {newsletterSubscribed ? (
                  <div className="px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} /> Subscribed! Check your inbox for secret coupons.
                  </div>
                ) : (
                  <>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address..."
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="px-4 py-3 rounded-xl bg-white text-slate-900 text-xs outline-none placeholder:text-slate-400 w-full sm:w-72"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-[#b93815] hover:bg-[#9a2e10] text-white text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer shrink-0"
                    >
                      Subscribe Now
                    </button>
                  </>
                )}
              </form>
            </div>
          </section>
        </main>
      ) : (
        /* ================= 2. CATALOG SEARCH / FILTER VIEW (MOCKUP 2) ================= */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center text-xs text-slate-500 gap-1.5">
            <button
              type="button"
              onClick={clearAllFilters}
              className="hover:text-[#0a2e8c] font-medium transition cursor-pointer"
            >
              Home
            </button>
            <ChevronRight size={12} className="text-slate-400" />
            <button
              type="button"
              onClick={clearAllFilters}
              className="hover:text-[#0a2e8c] font-medium transition cursor-pointer"
            >
              All Departments
            </button>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-bold text-slate-900">
              {activeCategoryName || activeStoreName || activeBrandName || searchQuery || 'Search Results'}
            </span>
          </nav>

          {/* Heading + Department Quick Pills */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-4">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                {activeStoreName
                  ? `${activeStoreName} Store`
                  : activeCategoryName
                  ? activeCategoryName
                  : searchQuery
                  ? `Search results for "${searchQuery}"`
                  : 'All Products'}{' '}
                <span className="text-lg font-bold text-slate-400">({displayedProducts.length} items)</span>
              </h1>

              {/* View switcher & Sort */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="bg-white border border-slate-300 text-xs font-bold text-slate-800 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>

                <div className="hidden sm:flex items-center rounded-lg border border-slate-300 bg-white p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#0a2e8c] text-white' : 'text-slate-500'}`}
                  >
                    <Grid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#0a2e8c] text-white' : 'text-slate-500'}`}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Filter Department Tags (Pills Row) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  !selectedCategory
                    ? 'bg-[#0a2e8c] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategory === (cat.id || cat._id)
                return (
                  <button
                    key={cat.id || cat._id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id || cat._id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#0a2e8c] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Filter Chips Strip */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500">Active:</span>

            {activeCategoryName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0a2e8c] text-xs font-bold">
                {activeCategoryName}
                <button onClick={() => handleSelectCategory('all')} className="hover:text-red-600 cursor-pointer">
                  <X size={13} />
                </button>
              </span>
            )}

            {activeBrandName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0a2e8c] text-xs font-bold">
                Brand: {activeBrandName}
                <button onClick={() => updateParam('brand', '')} className="hover:text-red-600 cursor-pointer">
                  <X size={13} />
                </button>
              </span>
            )}

            {activeStoreName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0a2e8c] text-xs font-bold">
                Store: {activeStoreName}
                <button onClick={() => updateParam('store', '')} className="hover:text-red-600 cursor-pointer">
                  <X size={13} />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                "{searchQuery}"
                <button onClick={() => updateParam('q', '')} className="hover:text-red-600 cursor-pointer">
                  <X size={13} />
                </button>
              </span>
            )}

            {(priceRange.min !== '' || priceRange.max !== '') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0a2e8c] text-xs font-bold">
                Price: ₹{priceRange.min || '0'} - {priceRange.max ? `₹${priceRange.max}` : 'Above'}
                <button onClick={() => setPriceRange({ min: '', max: '' })} className="hover:text-red-600 cursor-pointer">
                  <X size={13} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-bold text-[#b93815] hover:underline ml-2 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={12} /> Clear All
            </button>
          </div>

          {/* Main 2-Column Layout: Sidebar Filters + Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Left Filter Sidebar */}
            <aside className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-[#0a2e8c]" />
                  Filters
                </span>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Categories Section */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Categories</h4>
                <div className="space-y-1.5">
                  {categories.map((c) => {
                    const checked = selectedCategory === (c.id || c._id)
                    return (
                      <label
                        key={c.id || c._id}
                        className="flex items-center justify-between text-xs text-slate-700 cursor-pointer hover:text-[#0a2e8c]"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleSelectCategory(checked ? 'all' : c.id || c._id)}
                            className="rounded border-slate-300 text-[#0a2e8c] focus:ring-[#0a2e8c]"
                          />
                          <span className={checked ? 'font-bold text-[#0a2e8c]' : ''}>{c.name}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Brands Section */}
              {brands.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Brands</h4>
                  <div className="space-y-1.5">
                    {brands.map((b) => {
                      const checked = selectedBrand === (b.id || b._id)
                      return (
                        <label
                          key={b.id || b._id}
                          className="flex items-center justify-between text-xs text-slate-700 cursor-pointer hover:text-[#0a2e8c]"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => updateParam('brand', checked ? '' : b.id || b._id)}
                              className="rounded border-slate-300 text-[#0a2e8c] focus:ring-[#0a2e8c]"
                            />
                            <span className={checked ? 'font-bold text-[#0a2e8c]' : ''}>{b.name}</span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Price Range (₹)</h4>
                  {(priceRange.min !== '' || priceRange.max !== '') && (
                    <button
                      type="button"
                      onClick={() => setPriceRange({ min: '', max: '' })}
                      className="text-[11px] font-bold text-[#b93815] hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  {[
                    { label: 'All Prices', min: '', max: '' },
                    { label: 'Under ₹500', min: 0, max: 500 },
                    { label: '₹500 - ₹1,500', min: 500, max: 1500 },
                    { label: '₹1,500 - ₹5,000', min: 1500, max: 5000 },
                    { label: '₹5,000 & Above', min: 5000, max: '' },
                  ].map((p, idx) => {
                    const isChecked =
                      p.min === '' && p.max === ''
                        ? priceRange.min === '' && priceRange.max === ''
                        : priceRange.min === p.min && priceRange.max === p.max
                    return (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer hover:text-[#0a2e8c]">
                        <input
                          type="radio"
                          name="pricePreset"
                          value={p.label}
                          checked={isChecked}
                          onChange={() => setPriceRange({ min: p.min, max: p.max })}
                          className="text-[#0a2e8c] focus:ring-[#0a2e8c]"
                        />
                        <span className={isChecked ? 'font-bold text-[#0a2e8c]' : ''}>{p.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Vendor Type */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Vendor Type</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#0a2e8c]">
                    <input type="checkbox" defaultChecked className="rounded text-[#0a2e8c]" />
                    <span className="font-semibold">Official Flagship Stores</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#0a2e8c]">
                    <input type="checkbox" defaultChecked className="rounded text-[#0a2e8c]" />
                    <span className="font-semibold">Top Rated Merchants</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#0a2e8c]">
                    <input type="checkbox" className="rounded text-[#0a2e8c]" />
                    <span>Fulfilled by ShopVerse</span>
                  </label>
                </div>
              </div>
            </aside>

            {/* Right Product Grid */}
            <div className="lg:col-span-3 space-y-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-80 rounded-2xl animate-shimmer border border-slate-200" />
                  ))}
                </div>
              ) : displayedProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelectStore={(stId) => updateParam('store', stId)}
                      />
                    ))}
                  </div>

                  {/* Pagination Bar */}
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    pageSize={pagination.limit}
                    onPageChange={handlePageChange}
                    className="mt-6"
                  />
                </>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
                  <Search size={32} className="mx-auto text-slate-400 mb-3" />
                  <h3 className="text-base font-bold text-slate-900 mb-1">No matching products found</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    We couldn't find any products matching your current filters. Try resetting to browse all items.
                  </p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-5 py-2.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <RotateCcw size={14} /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ================= COMPREHENSIVE MARKETPLACE FOOTER (MATCHING STITCH) ================= */}
      <footer className="bg-white border-t border-slate-200 mt-16 font-sans">
        {/* Back to top button */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full py-3 bg-[#e8eeff] hover:bg-[#dbe4ff] text-[#0a2e8c] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b border-slate-200/80"
        >
          <ArrowUp size={14} />
          <span>Back to Top</span>
        </button>

        {/* 4 Footer Columns */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-xs">
          {/* Col 1 */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-950">About ShopVerse</h4>
            <ul className="space-y-2 text-slate-600 font-medium">
              <li><a href="#" className="hover:text-[#0a2e8c]">Company Info</a></li>
              <li><a href="#" className="hover:text-[#0a2e8c]">Careers &amp; Culture</a></li>
              <li><a href="#" className="hover:text-[#0a2e8c]">Press Releases</a></li>
              <li><a href="#" className="hover:text-[#0a2e8c]">Multi-Vendor Program</a></li>
              <li><a href="#" className="hover:text-[#0a2e8c]">Carbon Neutral Shipping</a></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-950">Make Money with Us</h4>
            <ul className="space-y-2 text-slate-600 font-medium">
              <li><Link to="/vendor/onboarding" className="hover:text-[#0a2e8c] font-bold text-[#0a2e8c]">Sell on ShopVerse</Link></li>
              <li><Link to="/vendor/onboarding" className="hover:text-[#0a2e8c]">Vendor Registration</Link></li>
              <li><a href="#" className="hover:text-[#0a2e8c]">Fulfillment by ShopVerse</a></li>
              <li><Link to="/vendor/dashboard" className="hover:text-[#0a2e8c]">Vendor Hub &amp; Tools</Link></li>
              <li><a href="#" className="hover:text-[#0a2e8c]">Advertise Your Products</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-950">Customer Service &amp; Policies</h4>
            <ul className="space-y-2 text-slate-600 font-medium">
              <li><a href="#" className="hover:text-[#0a2e8c]">Help Center &amp; FAQs</a></li>
              <li><Link to="/orders" className="hover:text-[#0a2e8c]">Track Your Order</Link></li>
              <li><a href="#" className="hover:text-[#0a2e8c]">Shipping Rates &amp; Policies</a></li>
              <li><a href="#" className="hover:text-[#0a2e8c]">Returns &amp; Replacements</a></li>
              <li><a href="#" className="hover:text-[#0a2e8c]">Report Suspicious Activity</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-950">Payment &amp; Security</h4>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Guaranteed safe, encrypted transactions compliant with strict PCI-DSS enterprise standards.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Stripe', 'PayPal', 'Apple Pay', 'Visa', 'Mastercard'].map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px]"
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-slate-600 text-[11px] font-semibold">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>256-Bit SSL Checkout Protection</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-100 py-6 text-center text-[11px] text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 ShopVerse Inc. All rights reserved. Designed for multi-vendor e-commerce platforms.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-600">Terms of Use</a>
              <a href="#" className="hover:text-slate-600">Privacy Policy</a>
              <a href="#" className="hover:text-slate-600">Cookie Preferences</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
