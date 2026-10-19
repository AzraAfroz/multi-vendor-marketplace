import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Edit2,
  FolderPlus,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import {
  createAdminBrand,
  createAdminCategory,
  deleteAdminBrand,
  deleteAdminCategory,
  getAdminBrands,
  getAdminCategories,
  updateAdminBrand,
  updateAdminCategory,
} from '../../services/catalogService.js'
import { apiErrorMessage } from '../../services/authService.js'
import Pagination from '../../components/common/Pagination.jsx'

export default function AdminCatalogPage() {
  const [tab, setTab] = useState('categories') // 'categories' | 'brands'
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [catPage, setCatPage] = useState(1)
  const [brandPage, setBrandPage] = useState(1)
  const pageSize = 8

  // Category Form State
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    parent: '',
    sortOrder: 0,
    isActive: true,
  })
  const [categorySaving, setCategorySaving] = useState(false)
  const [categoryFieldErrors, setCategoryFieldErrors] = useState({})

  // Brand Form State
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)
  const [brandForm, setBrandForm] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    isActive: true,
  })
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandFieldErrors, setBrandFieldErrors] = useState({})

  async function loadData() {
    setLoading(true)
    setErrorNotice('')
    try {
      const [cats, brs] = await Promise.all([getAdminCategories(), getAdminBrands()])
      setCategories(cats || [])
      setBrands(brs || [])
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function resetCategoryForm() {
    setCategoryForm({ name: '', slug: '', description: '', imageUrl: '', parent: '', sortOrder: 0, isActive: true })
    setEditingCategory(null)
    setShowCategoryForm(false)
    setCategoryFieldErrors({})
  }

  function startEditCategory(category) {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parent: category.parent?._id || category.parent || '',
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive !== false,
    })
    setShowCategoryForm(true)
    setCategoryFieldErrors({})
  }

  async function handleCategorySubmit(e) {
    e.preventDefault()
    setCategorySaving(true)
    setNotice('')
    setErrorNotice('')
    setCategoryFieldErrors({})

    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
      imageUrl: categoryForm.imageUrl.trim(),
      parent: categoryForm.parent || null,
      sortOrder: Number(categoryForm.sortOrder) || 0,
      isActive: categoryForm.isActive,
    }
    if (categoryForm.slug.trim()) {
      payload.slug = categoryForm.slug.trim()
    }

    try {
      if (editingCategory) {
        await updateAdminCategory(editingCategory._id, payload)
        setNotice(`Category "${payload.name}" updated successfully.`)
      } else {
        await createAdminCategory(payload)
        setNotice(`Category "${payload.name}" created successfully.`)
      }
      resetCategoryForm()
      await loadData()
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
      if (err.response?.data?.errors) {
        setCategoryFieldErrors(err.response.data.errors)
      }
    } finally {
      setCategorySaving(false)
    }
  }

  async function toggleCategoryActive(category) {
    setNotice('')
    setErrorNotice('')
    try {
      await updateAdminCategory(category._id, { isActive: !category.isActive })
      setNotice(`Category marked as ${!category.isActive ? 'Active' : 'Inactive'}.`)
      await loadData()
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
    }
  }

  async function handleDeleteCategory(categoryId) {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    setNotice('')
    setErrorNotice('')
    try {
      const res = await deleteAdminCategory(categoryId)
      setNotice(res.message || 'Category removed.')
      await loadData()
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
    }
  }

  function resetBrandForm() {
    setBrandForm({ name: '', slug: '', description: '', logoUrl: '', isActive: true })
    setEditingBrand(null)
    setShowBrandForm(false)
    setBrandFieldErrors({})
  }

  function startEditBrand(brand) {
    setEditingBrand(brand)
    setBrandForm({
      name: brand.name || '',
      slug: brand.slug || '',
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
      isActive: brand.isActive !== false,
    })
    setShowBrandForm(true)
    setBrandFieldErrors({})
  }

  async function handleBrandSubmit(e) {
    e.preventDefault()
    setBrandSaving(true)
    setNotice('')
    setErrorNotice('')
    setBrandFieldErrors({})

    const payload = {
      name: brandForm.name.trim(),
      description: brandForm.description.trim(),
      logoUrl: brandForm.logoUrl.trim(),
      isActive: brandForm.isActive,
    }
    if (brandForm.slug.trim()) {
      payload.slug = brandForm.slug.trim()
    }

    try {
      if (editingBrand) {
        await updateAdminBrand(editingBrand._id, payload)
        setNotice(`Brand "${payload.name}" updated successfully.`)
      } else {
        await createAdminBrand(payload)
        setNotice(`Brand "${payload.name}" created successfully.`)
      }
      resetBrandForm()
      await loadData()
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
      if (err.response?.data?.errors) {
        setBrandFieldErrors(err.response.data.errors)
      }
    } finally {
      setBrandSaving(false)
    }
  }

  async function toggleBrandActive(brand) {
    setNotice('')
    setErrorNotice('')
    try {
      await updateAdminBrand(brand._id, { isActive: !brand.isActive })
      setNotice(`Brand marked as ${!brand.isActive ? 'Active' : 'Inactive'}.`)
      await loadData()
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
    }
  }

  async function handleDeleteBrand(brandId) {
    if (!window.confirm('Are you sure you want to delete this brand?')) return
    setNotice('')
    setErrorNotice('')
    try {
      const res = await deleteAdminBrand(brandId)
      setNotice(res.message || 'Brand deleted.')
      await loadData()
    } catch (err) {
      setErrorNotice(apiErrorMessage(err))
    }
  }

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true
    return (
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const filteredBrands = brands.filter((b) => {
    if (!searchQuery.trim()) return true
    return (
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  useEffect(() => {
    setCatPage(1)
    setBrandPage(1)
  }, [searchQuery, tab])

  const totalCatPages = Math.ceil(filteredCategories.length / pageSize) || 1
  const paginatedCategories = filteredCategories.slice((catPage - 1) * pageSize, catPage * pageSize)

  const totalBrandPages = Math.ceil(filteredBrands.length / pageSize) || 1
  const paginatedBrands = filteredBrands.slice((brandPage - 1) * pageSize, brandPage * pageSize)

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0a2e8c] bg-[#0a2e8c]/10 px-2.5 py-1 rounded-md">
              MARKETPLACE CATALOG
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-500 font-semibold">Taxonomy &amp; Hierarchy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
            Categories &amp; Brand Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure global product departments, subcategories, and verified manufacturer brand accounts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setTab('categories')
              resetCategoryForm()
              resetBrandForm()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'categories'
                ? 'bg-[#0a2e8c] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers size={15} />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('brands')
              resetCategoryForm()
              resetBrandForm()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'brands'
                ? 'bg-[#0a2e8c] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Tag size={15} />
            <span>Brands ({brands.length})</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span className="font-bold">{notice}</span>
          </div>
          <button onClick={() => setNotice('')} className="text-emerald-700 hover:text-emerald-900">
            <X size={15} />
          </button>
        </motion.div>
      )}

      {errorNotice && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span className="font-bold">{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice('')} className="text-rose-700 hover:text-rose-900">
            <X size={15} />
          </button>
        </motion.div>
      )}

      {/* ================= TAB 1: CATEGORIES ================= */}
      {tab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories by name or slug..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a2e8c]/20 focus:border-[#0a2e8c] shadow-xs transition"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCategoryForm(!showCategoryForm)
                setEditingCategory(null)
              }}
              className="inline-flex items-center gap-2 bg-[#0a2e8c] hover:bg-[#07226b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {showCategoryForm ? <X size={15} /> : <Plus size={15} />}
              <span>{showCategoryForm ? 'Close Form' : 'New Category'}</span>
            </button>
          </div>

          {/* Category Form Modal / Slide-down */}
          <AnimatePresence>
            {showCategoryForm && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleCategorySubmit}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-blue-50 text-[#0a2e8c] grid place-items-center font-bold">
                      <FolderPlus size={16} />
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-950">
                      {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
                    </h3>
                  </div>
                  <button type="button" onClick={resetCategoryForm} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Category Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mobiles & Electronics"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#0a2e8c] focus:ring-1 focus:ring-[#0a2e8c]"
                    />
                    {categoryFieldErrors.name && (
                      <span className="text-[11px] text-rose-600 mt-1 block font-semibold">
                        {categoryFieldErrors.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Custom Slug (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generated if left blank"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#0a2e8c] focus:ring-1 focus:ring-[#0a2e8c]"
                    />
                    {categoryFieldErrors.slug && (
                      <span className="text-[11px] text-rose-600 mt-1 block font-semibold">
                        {categoryFieldErrors.slug}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Parent Category (Hierarchy)
                    </label>
                    <select
                      value={categoryForm.parent}
                      onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#0a2e8c] focus:ring-1 focus:ring-[#0a2e8c] bg-white cursor-pointer"
                    >
                      <option value="">None (Top-Level Category)</option>
                      {categories
                        .filter((c) => !editingCategory || c._id !== editingCategory._id)
                        .map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Display Sort Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={categoryForm.sortOrder}
                      onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#0a2e8c] focus:ring-1 focus:ring-[#0a2e8c]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Category Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={categoryForm.imageUrl}
                      onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#0a2e8c] focus:ring-1 focus:ring-[#0a2e8c]"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={categoryForm.isActive}
                        onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                        className="rounded border-slate-300 text-[#0a2e8c] focus:ring-[#0a2e8c] size-4"
                      />
                      <span>Active &amp; Visible in Storefront</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={categorySaving}
                    className="px-5 py-2 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {categorySaving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Categories Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Slug Path</th>
                    <th className="py-3.5 px-6">Hierarchy</th>
                    <th className="py-3.5 px-6">Sort Order</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Layers size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-800 text-sm">No categories found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedCategories.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            {c.imageUrl ? (
                              <img
                                src={c.imageUrl}
                                alt={c.name}
                                className="size-9 rounded-lg object-cover bg-slate-100"
                              />
                            ) : (
                              <div className="size-9 rounded-lg bg-blue-50 text-[#0a2e8c] grid place-items-center font-black text-xs">
                                <Layers size={15} />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 block">{c.name}</span>
                              {c.description && (
                                <span className="text-[10px] text-slate-400 truncate block max-w-xs">
                                  {c.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                          /{c.slug}
                        </td>
                        <td className="py-3.5 px-6">
                          {c.parent ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0a2e8c] font-bold text-[10px]">
                              {c.parent.name || c.parent}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-medium">Top Level</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-slate-600 font-bold">
                          {c.sortOrder ?? 0}
                        </td>
                        <td className="py-3.5 px-6">
                          <button
                            type="button"
                            onClick={() => toggleCategoryActive(c)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide cursor-pointer ${
                              c.isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {c.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditCategory(c)}
                              className="p-1.5 text-slate-500 hover:text-[#0a2e8c] hover:bg-slate-100 rounded-lg transition"
                              title="Edit Category"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(c._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredCategories.length > pageSize && (
              <div className="p-4 bg-slate-50/60 border-t border-slate-100">
                <Pagination
                  page={catPage}
                  totalPages={totalCatPages}
                  totalItems={filteredCategories.length}
                  pageSize={pageSize}
                  onPageChange={(p) => setCatPage(p)}
                  className="!pt-0 !border-0"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: BRANDS ================= */}
      {tab === 'brands' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brands by name or slug..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a2e8c]/20 focus:border-[#0a2e8c] shadow-xs transition"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setShowBrandForm(!showBrandForm)
                setEditingBrand(null)
              }}
              className="inline-flex items-center gap-2 bg-[#0a2e8c] hover:bg-[#07226b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {showBrandForm ? <X size={15} /> : <Plus size={15} />}
              <span>{showBrandForm ? 'Close Form' : 'New Brand'}</span>
            </button>
          </div>

          {/* Brand Form Modal */}
          <AnimatePresence>
            {showBrandForm && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleBrandSubmit}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-blue-50 text-[#0a2e8c] grid place-items-center font-bold">
                      <Tag size={16} />
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-950">
                      {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Register New Brand'}
                    </h3>
                  </div>
                  <button type="button" onClick={resetBrandForm} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Brand Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sony, Nike, Dyson"
                      value={brandForm.name}
                      onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#0a2e8c] focus:ring-1 focus:ring-[#0a2e8c]"
                    />
                    {brandFieldErrors.name && (
                      <span className="text-[11px] text-rose-600 mt-1 block font-semibold">
                        {brandFieldErrors.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Custom Slug (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generated if left blank"
                      value={brandForm.slug}
                      onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#0a2e8c] focus:ring-1 focus:ring-[#0a2e8c]"
                    />
                    {brandFieldErrors.slug && (
                      <span className="text-[11px] text-rose-600 mt-1 block font-semibold">
                        {brandFieldErrors.slug}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Brand Logo URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={brandForm.logoUrl}
                      onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#0a2e8c] focus:ring-1 focus:ring-[#0a2e8c]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Description / Manufacturer Bio
                    </label>
                    <input
                      type="text"
                      placeholder="Brief note about brand authenticity or guarantee"
                      value={brandForm.description}
                      onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#0a2e8c] focus:ring-1 focus:ring-[#0a2e8c]"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={brandForm.isActive}
                        onChange={(e) => setBrandForm({ ...brandForm, isActive: e.target.checked })}
                        className="rounded border-slate-300 text-[#0a2e8c] focus:ring-[#0a2e8c] size-4"
                      />
                      <span>Active in Brand Registry</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetBrandForm}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={brandSaving}
                    className="px-5 py-2 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {brandSaving ? 'Saving...' : editingBrand ? 'Save Brand' : 'Register Brand'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Brands Grid / Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrands.map((b) => (
              <div
                key={b._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:border-[#0a2e8c]/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {b.logoUrl ? (
                    <img
                      src={b.logoUrl}
                      alt={b.name}
                      className="size-10 rounded-xl object-contain border border-slate-100 p-1 bg-white shrink-0"
                    />
                  ) : (
                    <div className="size-10 rounded-xl bg-blue-50 text-[#0a2e8c] font-black text-xs grid place-items-center shrink-0">
                      {b.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">{b.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 block truncate">/{b.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleBrandActive(b)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                      b.isActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {b.isActive ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditBrand(b)}
                    className="p-1.5 text-slate-500 hover:text-[#0a2e8c] rounded-lg transition"
                    title="Edit Brand"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBrand(b._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Delete Brand"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredBrands.length > pageSize && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <Pagination
                page={brandPage}
                totalPages={totalBrandPages}
                totalItems={filteredBrands.length}
                pageSize={pageSize}
                onPageChange={(p) => setBrandPage(p)}
                className="!pt-0 !border-0"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
