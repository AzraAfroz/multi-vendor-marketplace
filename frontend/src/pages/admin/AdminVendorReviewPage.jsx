import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileText,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  User,
  X,
} from 'lucide-react'
import { apiErrorMessage } from '../../services/authService.js'
import {
  getPendingVendorApplications,
  getVendorKycDocument,
  reviewVendorApplication,
} from '../../services/vendorService.js'
import Pagination from '../../components/common/Pagination.jsx'

export default function AdminVendorReviewPage() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [notice, setNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')
  const [preview, setPreview] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5

  function loadApplications() {
    setLoading(true)
    setErrorNotice('')
    getPendingVendorApplications()
      .then(setVendors)
      .catch((error) => setErrorNotice(apiErrorMessage(error)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  async function showDocument(vendorId) {
    setNotice('')
    setErrorNotice('')
    try {
      const blob = await getVendorKycDocument(vendorId)
      const url = URL.createObjectURL(blob)
      setPreview({ vendorId, url })
    } catch (error) {
      setErrorNotice(apiErrorMessage(error))
    }
  }

  async function decide(vendorId, decision) {
    setBusyId(vendorId)
    setNotice('')
    setErrorNotice('')
    try {
      const result = await reviewVendorApplication(vendorId, decision)
      setVendors((current) => current.filter((vendor) => vendor.id !== vendorId))
      setNotice(result.message || `Store successfully ${decision === 'approve' ? 'approved' : 'rejected'}.`)
      setPreview((current) => {
        if (current?.vendorId === vendorId) URL.revokeObjectURL(current.url)
        return current?.vendorId === vendorId ? null : current
      })
    } catch (error) {
      setErrorNotice(apiErrorMessage(error))
    } finally {
      setBusyId('')
    }
  }

  const filteredVendors = vendors.filter((v) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      v.storeName?.toLowerCase().includes(q) ||
      v.owner?.name?.toLowerCase().includes(q) ||
      v.owner?.email?.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const totalPages = Math.ceil(filteredVendors.length / pageSize) || 1
  const paginatedVendors = filteredVendors.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0a2e8c] bg-[#0a2e8c]/10 px-2.5 py-1 rounded-md">
              COMPLIANCE &amp; TRUST
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-500 font-semibold">Vendor Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
            Vendor Applications &amp; KYC
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verify official business certificates, tax documents, and grant verified merchant storefront access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadApplications}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Main Vendor Queue Container */}
      <div className="space-y-6">
        {/* Search & Counter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by store name, merchant name, email..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a2e8c]/20 focus:border-[#0a2e8c] shadow-xs transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>Pending Submissions:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 font-mono text-xs font-black">
              {vendors.length}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <RefreshCw size={28} className="animate-spin text-[#0a2e8c] mx-auto" />
            <p className="text-sm font-bold text-slate-900">Syncing merchant applications...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs max-w-xl mx-auto space-y-4">
            <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mx-auto shadow-xs border border-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">No Pending Applications</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                All submitted vendor verification documents have been processed. When new sellers sign up and
                upload their business credentials, they will appear in this review cockpit.
              </p>
            </div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-bold transition shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Back to Executive Dashboard</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Applications List */}
            <div className="grid grid-cols-1 gap-6">
            {paginatedVendors.map((vendor) => {
              const hasDoc = Boolean(vendor.kycDocument?.storageKey)
              const uploadDate = vendor.kycDocument?.uploadedAt || vendor.createdAt

              return (
                <div
                  key={vendor.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 hover:border-[#0a2e8c]/40 transition-all"
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="size-12 rounded-2xl bg-[#0a2e8c] text-white font-black text-lg grid place-items-center shadow-md shrink-0">
                        <Store size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-lg font-black text-slate-950">{vendor.storeName}</h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                            Pending Verification
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <User size={13} className="text-slate-400" />
                            {vendor.owner?.name || 'Owner Name'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail size={13} className="text-slate-400" />
                            {vendor.owner?.email || 'email@example.com'}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Calendar size={13} />
                            Submitted {new Date(uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Decision Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => decide(vendor.id, 'reject')}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <X size={15} />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => decide(vendor.id, 'approve')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check size={15} />
                        <span>{busyId === vendor.id ? 'Processing...' : 'Approve Store'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Store Description */}
                  {vendor.description && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-800 block mb-0.5">Store Business Bio:</span>
                      {vendor.description}
                    </div>
                  )}

                  {/* Document Section */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs">
                      <FileCheck size={16} className="text-[#0a2e8c]" />
                      <span className="font-bold text-slate-800">Identity &amp; Tax Document:</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {vendor.kycDocument?.mimeType || 'PDF / Image Document'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => showDocument(vendor.id)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#0a2e8c] hover:bg-blue-100 text-xs font-bold transition cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>{preview?.vendorId === vendor.id ? 'Reload Document' : 'Inspect KYC File'}</span>
                    </button>
                  </div>

                  {/* Embedded Document Preview Frame */}
                  {preview?.vendorId === vendor.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 shadow-inner"
                    >
                      <div className="p-3 bg-slate-950 text-white flex items-center justify-between text-xs">
                        <span className="font-mono font-bold flex items-center gap-2">
                          <FileText size={14} className="text-blue-400" />
                          Document Viewer: {vendor.storeName}
                        </span>
                        <div className="flex items-center gap-3">
                          <a
                            href={preview.url}
                            download={`KYC-${vendor.storeName}.pdf`}
                            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold"
                          >
                            <Download size={13} /> Download
                          </a>
                          <button
                            type="button"
                            onClick={() => setPreview(null)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                      <iframe
                        src={preview.url}
                        title={`KYC document for ${vendor.storeName}`}
                        className="w-full h-96 border-none bg-white"
                      />
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>

          {filteredVendors.length > pageSize && (
            <div className="mt-6 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={filteredVendors.length}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                className="!pt-0 !border-0"
              />
            </div>
          )}
        </>
      )}
    </div>
    </div>
  )
}
