import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  HelpCircle,
  Lock,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Upload,
  User,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth.js'
import { apiErrorMessage } from '../../services/authService.js'
import { createVendorProfile, getMyVendorProfile, submitVendorKyc } from '../../services/vendorService.js'

export default function VendorOnboardingPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [values, setValues] = useState({ storeName: '', description: '' })
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [document, setDocument] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [noticeType, setNoticeType] = useState('error')
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    let isMounted = true
    getMyVendorProfile()
      .then((data) => {
        if (isMounted) {
          setVendor(data)
          if (data) {
            setValues({
              storeName: data.storeName || '',
              description: data.description || '',
            })
          }
        }
      })
      .catch((error) => {
        if (isMounted) {
          setNotice(apiErrorMessage(error))
          setNoticeType('error')
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
    if (errors[event.target.name]) {
      setErrors((prev) => ({ ...prev, [event.target.name]: '' }))
    }
  }

  async function submit(event) {
    event.preventDefault()
    setNotice('')
    const nextErrors = {}
    const storeName = values.storeName.trim()
    const description = values.description.trim()

    if (storeName.length < 2 || storeName.length > 80) {
      nextErrors.storeName = 'Use 2–80 characters for your store name.'
    }
    if (description.length > 500) {
      nextErrors.description = 'Keep your description under 500 characters.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    try {
      const result = await createVendorProfile({ storeName, description })
      setVendor(result.vendor)
      setNotice(result.message || 'Store profile registered successfully.')
      setNoticeType('success')
      await refreshUser().catch(() => {})
    } catch (error) {
      setNotice(apiErrorMessage(error))
      setNoticeType('error')
      setErrors(error.response?.data?.errors || {})
      if (error.response?.status === 409) {
        getMyVendorProfile().then(setVendor).catch(() => {})
      }
    } finally {
      setSaving(false)
    }
  }

  async function submitDocument(event) {
    event.preventDefault()
    setNotice('')
    if (!document) {
      setNotice('Choose a PDF, JPG, or PNG verification document.')
      setNoticeType('error')
      return
    }

    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!supportedTypes.includes(document.type)) {
      setNotice('Use a PDF, JPG, or PNG file.')
      setNoticeType('error')
      return
    }

    if (document.size > 5 * 1024 * 1024) {
      setNotice('The verification document must be 5 MB or smaller.')
      setNoticeType('error')
      return
    }

    setUploading(true)
    try {
      const result = await submitVendorKyc(document)
      setVendor(result.vendor)
      setNotice(result.message || 'Verification document uploaded successfully.')
      setNoticeType('success')
      setDocument(null)
    } catch (error) {
      setNotice(apiErrorMessage(error))
      setNoticeType('error')
    } finally {
      setUploading(false)
    }
  }

  function handleDrag(e) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setDocument(e.dataTransfer.files[0])
    }
  }

  const statusLabel = {
    draft: 'Profile Started',
    pending: 'Awaiting Admin Review',
    approved: 'Verified & Approved',
    rejected: 'Requires Re-upload',
  }

  const statusBadgeStyle = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-800 border-rose-200',
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3">
          <div className="size-10 border-3 border-[#0a2e8c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading store onboarding details…</p>
        </div>
      </main>
    )
  }

  const currentStep = !vendor ? 1 : vendor.status === 'draft' ? 2 : vendor.status === 'pending' ? 3 : 3

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#0a2e8c] text-white flex items-center justify-center font-bold shadow-xs">
              <Store size={20} />
            </div>
            <span className="text-xl font-black text-[#0a2e8c]">
              Shop<span className="text-slate-900">Verse</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/account"
              className="text-xs font-bold text-slate-600 hover:text-[#0a2e8c] transition flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Back to Account</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Intro & Step Wizard */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0a2e8c] text-[11px] font-black uppercase tracking-wider border border-blue-200 inline-block">
            Merchant Partner Program
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Launch Your Store on ShopVerse
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Sell directly to thousands of verified shoppers. Complete your store profile and business verification to unlock your merchant hub.
          </p>

          {/* Stepper Progress Bar */}
          <div className="pt-4 max-w-md mx-auto grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2.5 rounded-xl border text-center transition ${
              currentStep >= 1 ? 'border-[#0a2e8c] bg-blue-50/50 text-[#0a2e8c] font-black' : 'border-slate-200 text-slate-400'
            }`}>
              <span className="text-[10px] block uppercase font-bold">Step 1</span>
              <span>Store Info</span>
            </div>
            <div className={`p-2.5 rounded-xl border text-center transition ${
              currentStep >= 2 ? 'border-[#0a2e8c] bg-blue-50/50 text-[#0a2e8c] font-black' : 'border-slate-200 text-slate-400'
            }`}>
              <span className="text-[10px] block uppercase font-bold">Step 2</span>
              <span>KYC Document</span>
            </div>
            <div className={`p-2.5 rounded-xl border text-center transition ${
              vendor?.status === 'approved'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-black'
                : currentStep === 3
                ? 'border-amber-500 bg-amber-50 text-amber-800 font-black'
                : 'border-slate-200 text-slate-400'
            }`}>
              <span className="text-[10px] block uppercase font-bold">Step 3</span>
              <span>{vendor?.status === 'approved' ? 'Active' : 'Verification'}</span>
            </div>
          </div>
        </div>

        {/* Global Notice Alert */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
              noticeType === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {noticeType === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{notice}</span>
          </motion.div>
        )}

        {/* ================= STEP 1: STORE CREATION FORM ================= */}
        {!vendor ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="size-8 rounded-full bg-[#0a2e8c] text-white font-black text-sm grid place-items-center">
                1
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-950">Store Identity &amp; Information</h2>
                <p className="text-xs text-slate-500">Provide your official store name and introductory description.</p>
              </div>
            </div>

            <form onSubmit={submit} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Store Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="storeName"
                    value={values.storeName}
                    onChange={update}
                    placeholder="e.g. Apex Tech Supply, EcoHaven Living"
                    className={`w-full h-11 px-3.5 text-xs bg-slate-50 border rounded-xl outline-none transition focus:bg-white focus:border-[#0a2e8c] ${
                      errors.storeName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  <Store size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {errors.storeName && (
                  <p className="text-[11px] font-bold text-rose-600">{errors.storeName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    Store Bio / Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {values.description.length}/500
                  </span>
                </div>
                <textarea
                  name="description"
                  value={values.description}
                  onChange={update}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell shoppers about your catalog, manufacturing origins, and brand story..."
                  className={`w-full p-3.5 text-xs bg-slate-50 border rounded-xl outline-none transition focus:bg-white focus:border-[#0a2e8c] resize-none ${
                    errors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] font-bold text-rose-600">{errors.description}</p>
                )}
              </div>

              {/* Owner Badge */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-[#0a2e8c] text-white font-black text-xs grid place-items-center">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Store Owner</span>
                    <strong className="text-slate-900 font-bold block">{user?.name}</strong>
                    <span className="text-slate-500 text-[11px]">{user?.email}</span>
                  </div>
                </div>
                <ShieldCheck size={20} className="text-[#0a2e8c]" />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Store Profile…</span>
                  </>
                ) : (
                  <>
                    <span>Create Store &amp; Proceed to KYC</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ================= STEP 2 & 3: STORE EXISTS, MANAGE KYC ================= */
          <div className="space-y-6">
            {/* Store Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="size-12 rounded-2xl bg-blue-50 text-[#0a2e8c] grid place-items-center font-black">
                    <Store size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Registered Storefront
                    </span>
                    <h2 className="text-lg font-black text-slate-950">{vendor.storeName}</h2>
                    <p className="text-xs text-slate-500 font-medium">Owner: {user?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${
                    statusBadgeStyle[vendor.status] || statusBadgeStyle.draft
                  }`}>
                    {statusLabel[vendor.status] || 'Profile Started'}
                  </span>
                  <Link
                    to="/vendor/store"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              {vendor.description && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
                  {vendor.description}
                </p>
              )}
            </div>

            {/* Approved Store Banner */}
            {vendor.status === 'approved' ? (
              <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-200 text-center space-y-4 shadow-sm">
                <div className="size-16 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-emerald-950">Store Approved &amp; Active!</h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    Congratulations! Your merchant identity has been fully verified. You can now publish products, manage inventory, and fulfill customer orders.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                  <Link
                    to="/vendor/dashboard"
                    className="px-6 py-2.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                  >
                    <span>Open Vendor Dashboard</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/vendor/products"
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition flex items-center gap-2"
                  >
                    <Package size={15} />
                    <span>Manage Products</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* KYC Document Upload Section */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <span className="size-8 rounded-full bg-[#0a2e8c] text-white font-black text-sm grid place-items-center">
                    2
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">KYC Business Verification Document</h2>
                    <p className="text-xs text-slate-500">
                      Upload your official business license, GSTIN certificate, PAN, or government photo ID.
                    </p>
                  </div>
                </div>

                {vendor.status === 'pending' && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                    <Clock size={20} className="text-amber-700 shrink-0" />
                    <div>
                      <strong className="block font-bold">Document Currently Under Review</strong>
                      <span className="text-amber-800/90">
                        Our compliance team is reviewing your uploaded verification document. You may upload a replacement file anytime if needed.
                      </span>
                    </div>
                  </div>
                )}

                {vendor.status === 'rejected' && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
                    <AlertTriangle size={20} className="text-rose-700 shrink-0" />
                    <div>
                      <strong className="block font-bold">Document Rejected by Admin</strong>
                      <span className="text-rose-800/90">
                        Please provide a clearer, valid government-issued certificate or identification to proceed with verification.
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={submitDocument} className="space-y-4">
                  {/* Drag and Drop Box */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer relative ${
                      dragActive
                        ? 'border-[#0a2e8c] bg-blue-50/50'
                        : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="file"
                      id="kyc-doc-file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => setDocument(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />

                    <div className="space-y-3 pointer-events-none">
                      <div className="size-14 rounded-2xl bg-white shadow-2xs border border-slate-200 text-[#0a2e8c] grid place-items-center mx-auto">
                        <Upload size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">
                          {document ? document.name : 'Click to upload or drag & drop document'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Supported formats: PDF, JPG, PNG (Maximum file size: 5 MB)
                        </p>
                      </div>

                      {document && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0a2e8c] text-[11px] font-bold border border-blue-200">
                          <FileCheck2 size={13} />
                          <span>{(document.size / (1024 * 1024)).toFixed(2)} MB Selected</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Lock size={12} />
                      <span>Encrypted &amp; confidential storage</span>
                    </span>

                    <button
                      type="submit"
                      disabled={!document || uploading}
                      className="px-6 py-2.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] disabled:opacity-40 text-white font-bold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      {uploading ? (
                        <>
                          <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Uploading Document…</span>
                        </>
                      ) : (
                        <>
                          <FileCheck2 size={15} />
                          <span>Submit Verification Document</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Security & Verification Disclaimer Footer */}
        <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 text-center text-slate-500 text-[11px] leading-relaxed">
          <span>ShopVerse Merchant Security Guarantee • Verification documents are securely retained only for merchant authentication in accordance with marketplace terms and policies.</span>
        </div>
      </main>
    </div>
  )
}
