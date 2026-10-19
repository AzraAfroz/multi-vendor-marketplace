import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Layers,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  X,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import Pagination from '../../components/common/Pagination.jsx'
import { getAdminDashboardMetrics } from '../../services/dashboardService.js'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [range, setRange] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderPage, setOrderPage] = useState(1)
  const orderPageSize = 8

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        setLoading(true)
        setError('')
        const res = await getAdminDashboardMetrics(range)
        if (isMounted) setData(res)
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Failed to load executive dashboard metrics.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [range])

  const metrics = data?.metrics || {
    gmv: 0,
    netRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    activeVendors: 0,
    productsListed: 0,
    avgOrderValue: 0,
    pendingReviews: 0,
  }

  const ordersByStatus = data?.ordersByStatus || {
    delivered: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    pending: 0,
    cancelled: 0,
  }

  const platformHealth = data?.platformHealth || {
    deliveryRate: 92,
    fulfillmentRate: 96,
    paymentSuccess: 100,
    avgRating: 4.8,
  }

  const revenueByCategory = data?.revenueByCategory || []

  // Filter recent orders by search and status
  const filteredOrders = (data?.recentOrders || []).filter((o) => {
    const matchesSearch =
      !searchQuery ||
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'processing' && (o.status === 'processing' || o.status === 'confirmed')) ||
      o.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Reset order page if search or status filter changes
  useEffect(() => {
    setOrderPage(1)
  }, [searchQuery, statusFilter])

  const totalOrderPages = Math.ceil(filteredOrders.length / orderPageSize) || 1
  const paginatedOrders = filteredOrders.slice((orderPage - 1) * orderPageSize, orderPage * orderPageSize)

  // Format currency in Indian Rupees
  function formatINR(val = 0) {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`
    return `₹${Number(val).toLocaleString('en-IN')}`
  }

  const totalStatusCount = Object.values(ordersByStatus).reduce((a, b) => a + b, 0) || 1

  const statusColors = {
    delivered: '#10b981',
    confirmed: '#0a2e8c',
    processing: '#2563eb',
    shipped: '#f59e0b',
    pending: '#8b5cf6',
    cancelled: '#ef4444',
  }

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">
      {/* ================= 1. PAGE TITLE & TIME FILTER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0a2e8c] bg-[#0a2e8c]/10 px-2.5 py-1 rounded-md">
              ENTERPRISE COCKPIT
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-500 font-semibold">{todayFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
            Executive Analytics &amp; Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time platform throughput, marketplace transactions, and multi-vendor fulfillment telemetry.
          </p>
        </div>

        {/* Date Range Selector Pill */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs self-start md:self-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: '90d', label: '90D' },
            { id: 'all', label: 'All Time' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setRange(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                range === t.id
                  ? 'bg-[#0a2e8c] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* ================= 2. EIGHT ENTERPRISE KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: GMV */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-[#0a2e8c]/50 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0a2e8c] to-[#1d4ed8]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Gross Merchandise Value
            </span>
            <div className="size-9 rounded-xl bg-blue-50 text-[#0a2e8c] grid place-items-center">
              <DollarSign size={17} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {formatINR(metrics.gmv)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold text-[11px]">
                <TrendingUp size={12} /> +18.4%
              </span>
              <span className="text-slate-400 text-[11px]">vs previous cycle</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Net Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-500/50 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Platform Net Revenue
            </span>
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
              <CreditCard size={17} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {formatINR(metrics.netRevenue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold text-[11px]">
                10% Take Rate
              </span>
              <span className="text-slate-400 text-[11px]">settled commission</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-blue-500/50 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Total Order Volume
            </span>
            <div className="size-9 rounded-xl bg-blue-50 text-blue-700 grid place-items-center">
              <ShoppingBag size={17} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {metrics.totalOrders}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="text-slate-500 text-[11px] font-medium">
                in selected {range === 'all' ? 'period' : range} window
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Active Customers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-purple-500/50 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Registered Shoppers
            </span>
            <div className="size-9 rounded-xl bg-purple-50 text-purple-700 grid place-items-center">
              <Users size={17} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {metrics.activeCustomers}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="inline-flex items-center gap-0.5 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-extrabold text-[11px]">
                Active Buyers
              </span>
              <span className="text-slate-400 text-[11px]">unified accounts</span>
            </div>
          </div>
        </motion.div>

        {/* Card 5: Active Vendors */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-indigo-500/50 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Verified Brand Stores
            </span>
            <div className="size-9 rounded-xl bg-indigo-50 text-indigo-700 grid place-items-center">
              <Store size={17} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {metrics.activeVendors}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <Link
                to="/admin/vendors"
                className="text-xs font-bold text-[#0a2e8c] hover:underline flex items-center gap-1"
              >
                <span>{metrics.pendingReviews} pending KYC</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Card 6: Products Listed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-cyan-500/50 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Catalog Items Live
            </span>
            <div className="size-9 rounded-xl bg-cyan-50 text-cyan-700 grid place-items-center">
              <Package size={17} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {metrics.productsListed}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <Link to="/admin/categories" className="text-xs font-bold text-cyan-700 hover:underline">
                Manage Departments &rarr;
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Card 7: Avg Order Value */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-amber-500/50 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Average Order Value
            </span>
            <div className="size-9 rounded-xl bg-amber-50 text-amber-700 grid place-items-center">
              <Activity size={17} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {formatINR(metrics.avgOrderValue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 text-[11px]">
              average cart basket size
            </div>
          </div>
        </motion.div>

        {/* Card 8: Pending Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-rose-500/50 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Vendor Review Queue
            </span>
            <div className="size-9 rounded-xl bg-rose-50 text-rose-700 grid place-items-center">
              <ShieldCheck size={17} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {metrics.pendingReviews}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              {metrics.pendingReviews > 0 ? (
                <Link
                  to="/admin/vendors"
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                >
                  <span>Review Submissions</span>
                  <ArrowRight size={12} />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 size={12} /> All applications clear
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ================= 3. TRIPLE ANALYTICAL VISUALIZATIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Panel 1: Fulfillment Donut */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950 tracking-tight">
                Fulfillment Distribution
              </h2>
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                {totalStatusCount} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Order cycle pipeline &amp; dispatch velocity</p>
          </div>

          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative size-44">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="3.5"
                />
                {/* Delivered */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={statusColors.delivered}
                  strokeWidth="3.8"
                  strokeDasharray={`${((ordersByStatus.delivered || 1) / totalStatusCount) * 100} 100`}
                  strokeDashoffset="0"
                />
                {/* Confirmed / Processing */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={statusColors.processing}
                  strokeWidth="3.8"
                  strokeDasharray={`${((ordersByStatus.confirmed + ordersByStatus.processing) / totalStatusCount) * 100} 100`}
                  strokeDashoffset={`-${((ordersByStatus.delivered || 1) / totalStatusCount) * 100}`}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-950 font-mono">
                  {metrics.totalOrders}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">orders</span>
              </div>
            </div>

            {/* Status Legend Pills */}
            <div className="grid grid-cols-2 gap-2 mt-6 w-full text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Delivered
                </span>
                <span className="font-mono font-bold text-slate-900">{ordersByStatus.delivered}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="size-2 rounded-full bg-blue-500" />
                  Processing
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {ordersByStatus.confirmed + ordersByStatus.processing}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Shipped
                </span>
                <span className="font-mono font-bold text-slate-900">{ordersByStatus.shipped}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="size-2 rounded-full bg-rose-500" />
                  Cancelled
                </span>
                <span className="font-mono font-bold text-slate-900">{ordersByStatus.cancelled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Revenue by Department */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950 tracking-tight">
                Department Contribution
              </h2>
              <span className="text-[10px] font-bold text-[#0a2e8c] bg-blue-50 px-2 py-0.5 rounded font-mono">
                BY GMV
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Category sales breakdown &amp; volume share</p>
          </div>

          <div className="py-4 space-y-4 flex-1 flex flex-col justify-center">
            {revenueByCategory.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Package size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No category revenue recorded in this timeframe</p>
              </div>
            ) : (
              revenueByCategory.slice(0, 5).map((cat, idx) => {
                const maxRev = Math.max(...revenueByCategory.map((c) => c.revenue), 1)
                const pct = Math.round((cat.revenue / maxRev) * 100) || 10
                const colors = ['#0a2e8c', '#1d4ed8', '#0284c7', '#059669', '#d97706']
                const barColor = colors[idx % colors.length]

                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 truncate max-w-[150px]">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-normal">
                          {cat.itemsSold} sold
                        </span>
                        <span className="font-mono text-slate-950">{formatINR(cat.revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <Link
            to="/admin/categories"
            className="text-center block text-xs font-bold text-[#0a2e8c] hover:underline pt-2 border-t border-slate-100"
          >
            Manage Catalog Structure &rarr;
          </Link>
        </div>

        {/* Panel 3: Operational Health Gauges */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950 tracking-tight">
                System Quality &amp; SLA
              </h2>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                HEALTH: OPTIMAL
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Fulfillment reliability and buyer trust indices</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 py-4">
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col items-center text-center">
              <div className="size-14 rounded-full border-4 border-blue-600 flex items-center justify-center font-black text-sm text-slate-950 mb-1 font-mono">
                {platformHealth.deliveryRate}%
              </div>
              <span className="text-xs font-bold text-slate-800">Delivery SLA</span>
              <span className="text-[10px] text-slate-400">On-time rate</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col items-center text-center">
              <div className="size-14 rounded-full border-4 border-[#0a2e8c] flex items-center justify-center font-black text-sm text-slate-950 mb-1 font-mono">
                {platformHealth.fulfillmentRate}%
              </div>
              <span className="text-xs font-bold text-slate-800">Fulfillment</span>
              <span className="text-[10px] text-slate-400">Order success</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col items-center text-center">
              <div className="size-14 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-sm text-slate-950 mb-1 font-mono">
                {platformHealth.paymentSuccess}%
              </div>
              <span className="text-xs font-bold text-slate-800">Payment Escrow</span>
              <span className="text-[10px] text-slate-400">Zero-error gateway</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col items-center text-center">
              <div className="size-14 rounded-full border-4 border-amber-500 flex items-center justify-center font-black text-sm text-slate-950 mb-1 font-mono">
                {platformHealth.avgRating}★
              </div>
              <span className="text-xs font-bold text-slate-800">Buyer Score</span>
              <span className="text-[10px] text-slate-400">Certified reviews</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-2.5 text-xs text-[#0a2e8c]">
            <Sparkles size={16} className="shrink-0" />
            <span className="font-semibold text-[11px] leading-tight">
              All multi-vendor webhook workers and automated payouts operating at 99.98% uptime.
            </span>
          </div>
        </div>
      </div>

      {/* ================= 4. ENTERPRISE RECENT ORDERS TABLE ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-950 tracking-tight">
                Live Transaction Stream
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold text-xs">
                {filteredOrders.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified cross-vendor customer orders and settlement records
            </p>
          </div>

          {/* Search + Filter tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders or customer..."
                className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a2e8c]/20 focus:border-[#0a2e8c] transition w-full sm:w-56"
              />
            </div>

            {/* Status Quick Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'processing', label: 'Processing' },
                { id: 'shipped', label: 'Shipped' },
                { id: 'delivered', label: 'Delivered' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    statusFilter === pill.id
                      ? 'bg-white text-[#0a2e8c] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Order Date</th>
                <th className="py-3.5 px-6">Items</th>
                <th className="py-3.5 px-6">Total Amount</th>
                <th className="py-3.5 px-6">Gateway</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShoppingBag size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-800 text-sm">No matching transactions found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing search filters to inspect all orders.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isDelivered = order.status === 'delivered'
                  const isShipped = order.status === 'shipped'
                  const isCancelled = order.status === 'cancelled'
                  const isProcessing = order.status === 'processing' || order.status === 'confirmed'

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-mono font-bold text-[#0a2e8c]">
                        {order.orderNumber}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 block">{order.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{order.customerEmail}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold font-mono text-[11px]">
                          {order.itemCount} items
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        ₹{Number(order.totalPrice).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6">
                        <span className="uppercase text-[10px] font-bold text-slate-500 tracking-wider">
                          {order.paymentMethod || 'Razorpay'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black capitalize tracking-wide ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isShipped
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : isCancelled
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isDelivered
                                ? 'bg-emerald-500'
                                : isShipped
                                ? 'bg-sky-500'
                                : isCancelled
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0a2e8c] hover:text-white text-slate-700 text-xs font-bold transition shadow-2xs"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100">
          <Pagination
            page={orderPage}
            totalPages={totalOrderPages}
            totalItems={filteredOrders.length}
            pageSize={orderPageSize}
            onPageChange={(p) => setOrderPage(p)}
            className="!pt-0 !border-0"
          />
        </div>
      </div>
    </div>
  )
}
