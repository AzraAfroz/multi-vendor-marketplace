import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Edit2,
  Image as ImageIcon,
  Package,
  PackagePlus,
  Plus,
  Search,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import Pagination from '../../components/common/Pagination.jsx'
import { getMyVendorStore } from '../../services/vendorService.js'
import {
  createVendorProduct,
  deleteVendorProduct,
  getVendorProducts,
  updateVendorProduct,
  uploadVendorProductImage,
} from '../../services/vendorProductService.js'
import { getPublicBrands, getPublicCategories } from '../../services/catalogService.js'
import { apiErrorMessage } from '../../services/authService.js'

export default function VendorProductsPage() {
  const [vendor, setVendor] = useState(null)
  const [vendorLoading, setVendorLoading] = useState(true)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })

  const [notice, setNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')

  // Form State
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    category: '',
    brand: '',
    price: '',
    salePrice: '',
    stock: 0,
    description: '',
    status: 'draft',
    images: [],
  })
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  async function loadVendorAndCatalog() {
    setVendorLoading(true)
    try {
      const v = await getMyVendorStore()
      setVendor(v)
      if (v?.status === 'approved') {
        const [cats, brs] = await Promise.all([getPublicCategories(), getPublicBrands()])
        setCategories(cats?.items || [])
        setBrands(brs?.items || [])
      }
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
    } finally {
      setVendorLoading(false)
    }
  }

  async function loadProducts(pageToLoad = pagination.page) {
    if (!vendor || vendor.status !== 'approved') return
    setLoading(true)
    setErrorNotice('')
    try {
      const params = {
        page: pageToLoad,
        limit: pagination.limit || 10,
      }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await getVendorProducts(params)
      setProducts(res.items || [])
      if (res.pagination) {
        setPagination(res.pagination)
      }
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendorAndCatalog()
  }, [])

  useEffect(() => {
    if (vendor?.status === 'approved') {
      loadProducts()
    }
  }, [vendor, statusFilter])

  function resetForm() {
    setProductForm({
      name: '',
      slug: '',
      category: categories[0]?.id || '',
      brand: '',
      price: '',
      salePrice: '',
      stock: 0,
      description: '',
      status: 'active',
      images: [],
    })
    setImageUrlInput('')
    setEditingProduct(null)
    setShowForm(false)
    setFieldErrors({})
  }

  function startEdit(product) {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      slug: product.slug || '',
      category: product.category?._id || product.category?.id || product.category || '',
      brand: product.brand?._id || product.brand?.id || product.brand || '',
      price: product.price ?? '',
      salePrice: product.salePrice ?? '',
      stock: product.stock ?? 0,
      description: product.description || '',
      status: product.status || 'draft',
      images: product.images || [],
    })
    setImageUrlInput('')
    setShowForm(true)
    setFieldErrors({})
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setErrorNotice('')
    try {
      const res = await uploadVendorProductImage(file)
      if (res.url) {
        setProductForm((prev) => ({
          ...prev,
          images: [...prev.images, { url: res.url, alt: '' }],
        }))
      }
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  function addImageUrl() {
    if (!imageUrlInput.trim()) return
    setProductForm((prev) => ({
      ...prev,
      images: [...prev.images, { url: imageUrlInput.trim(), alt: '' }],
    }))
    setImageUrlInput('')
  }

  function removeImage(index) {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setNotice('')
    setErrorNotice('')
    setFieldErrors({})

    const payload = {
      name: productForm.name.trim(),
      category: productForm.category,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      description: productForm.description.trim(),
      status: productForm.status,
      images: productForm.images,
    }
    if (productForm.slug.trim()) payload.slug = productForm.slug.trim()
    if (productForm.brand) payload.brand = productForm.brand
    else payload.brand = null

    if (productForm.salePrice !== '' && productForm.salePrice !== null) {
      payload.salePrice = Number(productForm.salePrice)
    } else {
      payload.salePrice = null
    }

    try {
      if (editingProduct) {
        const res = await updateVendorProduct(editingProduct._id, payload)
        setNotice(res.message || 'Product updated.')
      } else {
        const res = await createVendorProduct(payload)
        setNotice(res.message || 'Product created.')
      }
      resetForm()
      await loadProducts()
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
      if (err.response?.data?.errors) setFieldErrors(err.response.data.errors)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(productId) {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    setNotice('')
    setErrorNotice('')
    try {
      const res = await deleteVendorProduct(productId)
      setNotice(res.message || 'Product deleted.')
      await loadProducts()
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
    }
  }

  if (vendorLoading) {
    return <main className="min-h-screen bg-[#f8f9fa] grid place-items-center text-xs text-gray-500">Checking store authorization...</main>
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#242e38] font-sans pb-16">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link to="/vendor/store" className="flex items-center gap-2 font-bold text-lg text-[#0a2e8c] tracking-tight">
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#0a2e8c]"><Store size={20} /></span>
            {vendor?.storeName || 'Vendor Portal'}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-600">Product Management</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link to="/vendor/store" className="text-slate-600 hover:text-[#0a2e8c] transition">Store Profile</Link>
          <Link to="/account" className="text-slate-600 hover:text-[#0a2e8c] transition">My Account</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <Link to="/vendor/store" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft size={14} /> Back to store profile
        </Link>

        {vendor?.status !== 'approved' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-xs">
            <AlertCircle className="size-12 text-amber-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-amber-900 mb-2">Store Pending Approval</h2>
            <p className="text-xs text-amber-800/80 leading-relaxed mb-6">
              Your store is currently in <strong>{vendor?.status || 'review'}</strong> status. Only approved vendor stores can add, publish, and manage products on the marketplace.
            </p>
            <Link
              to="/vendor/onboarding"
              className="inline-flex items-center gap-1.5 bg-amber-800 hover:bg-amber-900 text-white px-4 py-2 rounded-lg text-xs font-bold transition"
            >
              Check Identity Verification
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0a2e8c] block mb-1">STORE CATALOG</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Products &amp; Inventory</h1>
                <p className="text-sm text-slate-600 mt-1">Manage pricing, stock counts, images, and catalog visibility for your store.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (showForm) resetForm()
                  else {
                    resetForm()
                    setShowForm(true)
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-[#0a2e8c] hover:bg-[#07226b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition self-start sm:self-auto cursor-pointer"
              >
                {showForm ? <X size={15} /> : <Plus size={15} />}
                {showForm ? 'Close Form' : 'Add New Product'}
              </button>
            </div>

            {notice && (
              <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between" role="status">
                <span>{notice}</span>
                <button onClick={() => setNotice('')} className="text-emerald-600 hover:text-emerald-900"><X size={14} /></button>
              </div>
            )}

            {errorNotice && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between" role="alert">
                <span>{errorNotice}</span>
                <button onClick={() => setErrorNotice('')} className="text-red-600 hover:text-red-900"><X size={14} /></button>
              </div>
            )}

            {/* CREATE / EDIT FORM */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <PackagePlus size={18} className="text-emerald-700" />
                    {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add Product to Your Store'}
                  </h3>
                  <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wireless Noise-Cancelling Headphones"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                    />
                    {fieldErrors.name && <span className="text-[11px] text-red-600 mt-0.5 block">{fieldErrors.name}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white"
                    >
                      <option value="">Select a Category</option>
                      {categories.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                      ))}
                    </select>
                    {fieldErrors.category && <span className="text-[11px] text-red-600 mt-0.5 block">{fieldErrors.category}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Brand (optional)</label>
                    <select
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white"
                    >
                      <option value="">No Brand / Generic</option>
                      {brands.map((b) => (
                        <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Regular Price (₹ INR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="e.g. 1499"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                    />
                    {fieldErrors.price && <span className="text-[11px] text-red-600 mt-0.5 block">{fieldErrors.price}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Sale / Discount Price (₹ INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Optional (must be <= regular price)"
                      value={productForm.salePrice}
                      onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                    />
                    {fieldErrors.salePrice && <span className="text-[11px] text-red-600 mt-0.5 block">{fieldErrors.salePrice}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Available items"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                    />
                    {fieldErrors.stock && <span className="text-[11px] text-red-600 mt-0.5 block">{fieldErrors.stock}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Publication Status</label>
                    <select
                      value={productForm.status}
                      onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white"
                    >
                      <option value="active">Active (Visible in Customer Store)</option>
                      <option value="draft">Draft (Hidden from Marketplace)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={4}
                      placeholder="Detail the specifications, materials, features, and warranty for customers..."
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  {/* IMAGES SECTION */}
                  <div className="sm:col-span-2 lg:col-span-3 border-t border-gray-100 pt-4">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Product Images</label>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                      <label className="inline-flex items-center justify-center gap-2 px-3.5 py-2 border border-dashed border-emerald-600 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition">
                        <Upload size={14} />
                        <span>{uploadingImage ? 'Uploading Image...' : 'Upload Image File (JPG/PNG)'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingImage}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="url"
                          placeholder="Or paste external image URL..."
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-700"
                        />
                        <button
                          type="button"
                          onClick={addImageUrl}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {/* Image thumbnails */}
                    {productForm.images.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        {productForm.images.map((img, idx) => (
                          <div key={idx} className="relative group size-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                            <img src={img.url} alt="" className="size-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[11px] font-bold"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 disabled:opacity-60 shadow-xs">
                    {saving ? 'Saving Product...' : editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            )}

            {/* FILTERS & SEARCH */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 mb-6 shadow-xs">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Filter by product title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') loadProducts() }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadProducts}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                >
                  Search
                </button>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none bg-white font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="draft">Drafts Only</option>
                  <option value="archived">Archived Only</option>
                </select>
              </div>
            </div>

            {/* PRODUCT LIST */}
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
                <Package className="size-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800">No products found in your store</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No products match your current search filters. Try clearing your search.'
                    : 'List your items with photos, prices, and inventory to start selling.'}
                </p>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(true); }}
                  className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition"
                >
                  <Plus size={14} /> Add First Product
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Item</th>
                        <th className="py-3.5 px-4">Category / Brand</th>
                        <th className="py-3.5 px-4">Pricing</th>
                        <th className="py-3.5 px-4">Stock</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((p) => {
                        const thumb = p.images?.[0]?.url
                        return (
                          <tr key={p._id} className="hover:bg-gray-50/50 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {thumb ? (
                                  <img src={thumb} alt={p.name} className="size-10 rounded-lg object-cover border border-gray-200 shrink-0" />
                                ) : (
                                  <div className="size-10 rounded-lg bg-gray-100 text-gray-400 grid place-items-center shrink-0">
                                    <ImageIcon size={18} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <strong className="block text-gray-900 font-bold truncate max-w-xs">{p.name}</strong>
                                  <span className="text-[10px] text-gray-400 font-mono">/{p.slug}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-gray-600">
                              <span className="block font-medium">{p.category?.name || 'Uncategorized'}</span>
                              {p.brand && <span className="text-[10px] text-gray-400">{p.brand.name}</span>}
                            </td>
                            <td className="py-3.5 px-4">
                              {p.salePrice !== null && p.salePrice !== undefined ? (
                                <div>
                                  <span className="text-emerald-700 font-bold font-mono">₹{Number(p.salePrice).toLocaleString('en-IN')}</span>
                                  <span className="text-slate-400 text-[10px] line-through ml-1.5 font-mono">₹{Number(p.price).toLocaleString('en-IN')}</span>
                                </div>
                              ) : (
                                <span className="font-bold text-slate-900 font-mono">₹{Number(p.price).toLocaleString('en-IN')}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : p.stock < 5 ? 'text-amber-600' : 'text-gray-700'}`}>
                                {p.stock} units
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${p.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : p.status === 'draft' ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEdit(p)}
                                  className="p-1.5 text-gray-500 hover:text-emerald-700 rounded hover:bg-gray-100 transition"
                                  title="Edit Product"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-700 rounded hover:bg-red-50 transition"
                                  title="Delete Product"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {!loading && products.length > 0 && (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    pageSize={pagination.limit}
                    onPageChange={(nextPage) => loadProducts(nextPage)}
                    className="mt-4 px-2"
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
