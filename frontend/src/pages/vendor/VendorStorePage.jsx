import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  ExternalLink,
  FileCheck2,
  FileText,
  Mail,
  Package,
  Save,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  User,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth.js'
import { apiErrorMessage } from '../../services/authService.js'
import { getMyVendorStore } from '../../services/vendorService.js'

export default function VendorStorePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    getMyVendorStore()
      .then((data) => {
        if (isMounted) setVendor(data)
      })
      .catch((requestError) => {
        if (isMounted) setError(apiErrorMessage(requestError))
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const statusConfig = {
    approved: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      label: 'Verified & Active Store',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      description: 'Your business KYC is approved. Your products are live and discoverable across ShopVerse.',
    },
    pending: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      label: 'Pending KYC Review',
      icon: Clock,
      iconColor: 'text-amber-600',
      description: 'Your verification document is under review by our compliance team. Review typically takes 24-48 hours.',
    },
    rejected: {
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      label: 'Action Required',
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      description: 'Your KYC submission was not approved. Please upload a clear replacement document to resume verification.',
    },
    draft: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      label: 'Setup Incomplete',
      icon: AlertCircle,
      iconColor: 'text-slate-500',
      description: 'Upload your business verification documents to submit your store for customer visibility.',
    },
  }

  const currentStatus = vendor?.status ? statusConfig[vendor.status] || statusConfig.draft : statusConfig.draft
  const StatusIcon = currentStatus.icon

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3">
          <div className="size-10 border-3 border-[#0a2e8c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading store profile &amp; credentials…</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-[#0a2e8c] text-white flex items-center justify-center font-bold shadow-xs">
                <Store size={20} />
              </div>
              <span className="text-xl font-black text-[#0a2e8c]">
                Shop<span className="text-slate-900">Verse</span>
              </span>
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Vendor Storefront &amp; Settings</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/vendor/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Vendor Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/account" className="hover:text-[#0a2e8c] transition">Account</Link>
              <span>/</span>
              <Link to="/vendor/dashboard" className="hover:text-[#0a2e8c] transition">Vendor Portal</Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Store Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Store Profile &amp; Verification
            </h1>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/vendor/products"
              className="px-4 py-2 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
            >
              <Package size={15} />
              <span>Manage Products</span>
            </Link>
            <Link
              to="/vendor/orders"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-2"
            >
              <ShoppingBag size={15} />
              <span>Store Orders</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Store Banner Hero Card */}
        {vendor ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Store Cover Header Gradient */}
            <div className="h-36 sm:h-44 bg-gradient-to-r from-[#0a2e8c] via-[#1e40af] to-[#3b82f6] p-6 flex items-end justify-between relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10 flex items-center gap-2 text-white/80 text-xs font-bold bg-black/20 backdrop-blur-xs px-3 py-1 rounded-full">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>ShopVerse Verified Partner Network</span>
              </div>
            </div>

            {/* Profile Bar */}
            <div className="px-6 sm:px-8 pb-8 pt-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-6">
                <div className="flex items-end gap-4">
                  <div className="size-24 sm:size-28 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-[#0a2e8c] font-black text-2xl sm:text-3xl shrink-0 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                    <Store size={44} className="text-[#0a2e8c]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                        {vendor.storeName}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border uppercase tracking-wider flex items-center gap-1 ${currentStatus.badge}`}>
                        <StatusIcon size={12} className={currentStatus.iconColor} />
                        <span>{vendor.status || 'draft'}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Managed by <strong className="text-slate-700">{user?.name}</strong> ({user?.email})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {vendor.status === 'approved' ? (
                    <Link
                      to="/"
                      className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0a2e8c] text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ExternalLink size={14} />
                      <span>View on Marketplace</span>
                    </Link>
                  ) : (
                    <Link
                      to="/vendor/onboarding"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <FileCheck2 size={14} />
                      <span>Complete KYC</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Status Notice Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-8 ${currentStatus.badge}`}>
                <div className="flex items-start sm:items-center gap-3">
                  <StatusIcon size={20} className={`${currentStatus.iconColor} shrink-0`} />
                  <div>
                    <strong className="block font-bold">{currentStatus.label}</strong>
                    <span className="opacity-90">{currentStatus.description}</span>
                  </div>
                </div>
                {vendor.status !== 'approved' && (
                  <Link
                    to="/vendor/onboarding"
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-white font-bold shadow-2xs hover:bg-slate-50 transition text-slate-900 text-center"
                  >
                    Update Verification &rarr;
                  </Link>
                )}
              </div>

              {/* Grid 2 Columns: Store Information & Metrics Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Store Profile Details (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-4">
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                      <Building2 size={16} className="text-[#0a2e8c]" />
                      <span>Store Details &amp; Public Bio</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Store Name</span>
                        <p className="font-bold text-slate-900">{vendor.storeName}</p>
                      </div>

                      <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Account Role</span>
                        <p className="font-bold text-slate-900 capitalize">{user?.role || 'Vendor'} Account</p>
                      </div>

                      <div className="sm:col-span-2 space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Store Bio / Description</span>
                        <p className="font-medium text-slate-700 leading-relaxed">
                          {vendor.description || 'No description provided yet. Add an engaging store bio to build trust with marketplace shoppers.'}
                        </p>
                      </div>

                      <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Member Since</span>
                        <p className="font-bold text-slate-900">
                          {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }) : 'Active'}
                        </p>
                      </div>

                      <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">KYC Status</span>
                        <p className="font-bold text-slate-900 capitalize">{vendor.status || 'draft'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational Capabilities */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={16} className="text-[#0a2e8c]" />
                      <span>Fulfillment &amp; Policy Standards</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dispatch Speed</span>
                        <strong className="text-slate-900 font-bold block">Within 24 Hours</strong>
                        <span className="text-[10px] text-slate-500">Fast Express Node</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Buyer Guarantee</span>
                        <strong className="text-slate-900 font-bold block">100% Genuine</strong>
                        <span className="text-[10px] text-slate-500">Direct from Brand</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Return Window</span>
                        <strong className="text-slate-900 font-bold block">7 Days Easy Return</strong>
                        <span className="text-[10px] text-slate-500">ShopVerse Covered</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Hub & Compliance (1 col) */}
                <div className="space-y-6">
                  {/* Quick Shortcuts */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-3">
                    <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider mb-2">
                      Store Operations
                    </h4>

                    <Link
                      to="/vendor/products"
                      className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 flex items-center justify-between text-xs font-bold text-slate-800 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package size={16} className="text-[#0a2e8c]" />
                        <span>Add &amp; Edit Products</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/vendor/orders"
                      className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 flex items-center justify-between text-xs font-bold text-slate-800 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag size={16} className="text-[#0a2e8c]" />
                        <span>Process Orders</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/vendor/dashboard"
                      className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 flex items-center justify-between text-xs font-bold text-slate-800 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingUp size={16} className="text-[#0a2e8c]" />
                        <span>Sales Analytics</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/vendor/onboarding"
                      className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 flex items-center justify-between text-xs font-bold text-slate-800 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCheck2 size={16} className="text-[#0a2e8c]" />
                        <span>KYC Verification Documents</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400" />
                    </Link>
                  </div>

                  {/* Help & Support */}
                  <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2 text-xs">
                    <h4 className="font-black text-slate-950 flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-[#0a2e8c]" />
                      <span>Vendor Partner Support</span>
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Need assistance with inventory feeds, bulk uploads, or payment payouts? Our merchant relations team is available 24/7.
                    </p>
                    <a
                      href="mailto:support@shopverse.market"
                      className="inline-block text-[#0a2e8c] font-bold hover:underline pt-1 text-[11px]"
                    >
                      Contact Partner Support &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
            <div className="size-16 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mx-auto">
              <Store size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900">No Store Profile Found</h3>
            <p className="text-xs text-slate-500">
              You haven't set up your vendor store yet. Start selling products by creating your merchant profile.
            </p>
            <Link
              to="/vendor/onboarding"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-bold transition shadow-xs"
            >
              <Store size={14} />
              <span>Create Vendor Store</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
