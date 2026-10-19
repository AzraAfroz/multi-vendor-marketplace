import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Filter,
  Grid,
  Layers,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  X,
} from 'lucide-react'
import ShoppingHeader from '../../components/shop/ShoppingHeader.jsx'
import ProductCard from '../../components/shop/ProductCard.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import {
  getPublicCategories,
  getPublicProducts,
  getPublicStore,
} from '../../services/catalogService.js'
import { apiErrorMessage } from '../../services/authService.js'

export default function PublicStorePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [store, setStore] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [error, setError] = useState('')

  // Search & Filters within store
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'newest')
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // Load store profile & categories
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')

    Promise.all([
      getPublicStore(id),
      getPublicCategories({ limit: 50 }).catch(() => ({ items: [] })),
    ])
      .then(([storeData, catData]) => {
        if (!isMounted) return
        setStore(storeData)
        setCategories(catData?.items || [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(apiErrorMessage(err) || 'Unable to load store.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  // Load store's products with filters
  useEffect(() => {
    if (!id) return
    let isMounted = true
    setProductsLoading(true)

    const params = {
      store: id,
      page: currentPage,
      limit: 12,
      sort: selectedSort,
    }
    if (searchTerm.trim()) params.q = searchTerm.trim()
    if (selectedCategory) params.category = selectedCategory

    getPublicProducts(params)
      .then((data) => {
        if (!isMounted) return
        setProducts(data?.items || [])
        setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 })
      })
      .catch(() => {
        if (!isMounted) return
        setProducts([])
      })
      .finally(() => {
        if (isMounted) setProductsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id, currentPage, selectedSort, selectedCategory, searchTerm])

  function handleSearchSubmit(e) {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (searchTerm.trim()) next.set('q', searchTerm.trim())
    else next.delete('q')
    next.set('page', '1')
    setSearchParams(next)
  }

  function handleCategoryFilter(catId) {
    setSelectedCategory(catId)
    const next = new URLSearchParams(searchParams)
    if (catId) next.set('category', catId)
    else next.delete('category')
    next.set('page', '1')
    setSearchParams(next)
  }

  function handleSortChange(sort) {
    setSelectedSort(sort)
    const next = new URLSearchParams(searchParams)
    next.set('sort', sort)
    next.set('page', '1')
    setSearchParams(next)
  }

  function handlePageChange(page) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next)
    window.scrollTo({ top: 380, behavior: 'smooth' })
  }

  function handleClearFilters() {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedSort('newest')
    setSearchParams({})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="size-10 border-3 border-[#0a2e8c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Loading verified storefront…</p>
        </div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <ShoppingHeader categories={categories} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs">
            <div className="size-14 rounded-full bg-rose-50 text-rose-600 grid place-items-center mx-auto mb-3">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Store Not Found</h2>
            <p className="text-xs text-slate-500 mb-6">{error || 'This storefront does not exist or is currently inactive.'}</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    )
  }

  const memberDate = store.createdAt
    ? new Date(store.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '2026'

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 flex-wrap" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#0a2e8c] font-medium">Home</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <Link to="/products" className="hover:text-[#0a2e8c] font-medium">Stores</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{store.name}</span>
        </nav>

        {/* Store Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0a2e8c] via-[#0d3ba8] to-[#1e40af] text-white p-6 sm:p-10 shadow-lg border border-blue-900/40">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <div className="size-20 sm:size-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center shrink-0 shadow-inner">
                <Store size={40} className="text-white" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                    <ShieldCheck size={14} /> Verified Partner Store
                  </span>
                  <span className="text-xs text-blue-200">
                    Partner since {memberDate}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{store.name}</h1>
                <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                  {store.description || 'Welcome to our official marketplace storefront! Discover high quality products backed by direct vendor warranty and support.'}
                </p>
              </div>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 shrink-0 self-start md:self-auto">
              <div className="text-center pr-3 border-r border-white/20">
                <span className="block text-2xl font-black">{pagination.total || 0}</span>
                <span className="text-[11px] text-blue-200 uppercase font-bold tracking-wider">Products</span>
              </div>
              <div className="text-center pl-1">
                <span className="inline-flex items-center gap-1 text-emerald-300 text-sm font-bold">
                  <CheckCircle2 size={16} /> 100%
                </span>
                <span className="block text-[11px] text-blue-200 uppercase font-bold tracking-wider">Genuine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Search & Filter Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search in ${store.name}…`}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    const next = new URLSearchParams(searchParams)
                    next.delete('q')
                    next.set('page', '1')
                    setSearchParams(next)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Sorting & Filter summary */}
            <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Sort by:</span>
                <select
                  value={selectedSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0a2e8c] cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="top_rated">Top Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

              {(searchTerm || selectedCategory) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  <X size={14} /> Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Category Quick Chips */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0">Categories:</span>
              <button
                type="button"
                onClick={() => handleCategoryFilter('')}
                className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 cursor-pointer ${
                  !selectedCategory
                    ? 'bg-[#0a2e8c] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Products ({pagination.total})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#0a2e8c] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <section aria-label="Store Catalog">
          {productsLoading ? (
            <div className="py-20 text-center">
              <div className="size-8 border-3 border-[#0a2e8c] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Fetching catalog from {store.name}…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs max-w-xl mx-auto">
              <div className="size-16 rounded-full bg-slate-100 text-slate-400 grid place-items-center mx-auto mb-4">
                <Package size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No products found</h3>
              <p className="text-xs text-slate-500 mb-6">
                {searchTerm || selectedCategory
                  ? 'No items matched your search criteria in this store.'
                  : 'This seller has not listed any active inventory yet. Check back soon!'}
              </p>
              {(searchTerm || selectedCategory) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  View All Products in {store.name}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

