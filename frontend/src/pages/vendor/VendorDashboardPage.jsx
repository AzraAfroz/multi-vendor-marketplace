import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Box,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth.js'
import { getVendorDashboardMetrics } from '../../services/dashboardService.js'

export default function VendorDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [range, setRange] = useState('7d') // 7d | 30d | 1y
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [searchOrderQuery, setSearchOrderQuery] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const res = await getVendorDashboardMetrics(range)
      setData(res)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vendor dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [range])

  const store = data?.store || {
    storeName: 'TechNova Global',
    description: 'Premium electronics, lifestyle, gaming & accessories.',
    status: 'approved',
  }

  const metrics = data?.metrics || {
    todayRevenue: 2450,
    totalRevenue: 48294.5,
    pendingOrders: 1428,
    totalProducts: 45,
    avgRating: 4.9,
  }

  // Simulated orders if none yet
  const recentOrders = [
    {
      id: 'ORD-94821',
      customer: 'Eleanor Vance',
      location: 'New York, US',
      skuName: 'Ergo Pro Wireless Keyboard',
      skuCode: 'EP-K99-SL',
      skuImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80',
      quantity: 1,
      total: 149.0,
      status: 'Ready to Ship',
      statusClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      actionLabel: 'Dispatch',
    },
    {
      id: 'ORD-94820',
      customer: 'Marcus Brody',
      location: 'London, UK',
      skuName: 'Apex Studio ANC Headphones',
      skuCode: 'AS-ANC-01',
      skuImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
      quantity: 2,
      total: 598.0,
      status: 'Dispatched',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-200',
      actionLabel: 'Track',
    },
    {
      id: 'ORD-94819',
      customer: 'Sophia Chen',
      location: 'Sydney, AU',
      skuName: 'UltraView 34" Curved Monitor',
      skuCode: 'UV-34-CR',
      skuImage: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&auto=format&fit=crop&q=80',
      quantity: 1,
      total: 649.0,
      status: 'Processing',
      statusClass: 'bg-blue-50 text-[#0a2e8c] border-blue-200',
      actionLabel: 'Dispatch',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f3f5fa] flex font-sans text-slate-900">
      {/* ================= LEFT SIDEBAR (MATCHING MOCKUP 5) ================= */}
      <aside className="w-64 bg-white border-r border-slate-200/90 hidden md:flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Brand Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="size-8 rounded-xl bg-[#0a2e8c] text-white flex items-center justify-center font-bold">
                <Store size={18} />
              </span>
              <span className="font-black text-lg text-slate-900">
                Market<span className="text-[#0a2e8c]">place</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 text-xs font-bold">
            <Link
              to="/vendor/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#0a2e8c] text-white shadow-sm"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/vendor/products"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
            >
              <Package size={18} />
              <span>Products</span>
            </Link>

            <Link
              to="/vendor/orders"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
            >
              <ShoppingBag size={18} />
              <span>Orders</span>
            </Link>

            <Link
              to="/vendor/products"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
            >
              <Box size={18} />
              <span>Inventory</span>
            </Link>

            <Link
              to="/vendor/store"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
            >
              <Settings size={18} />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-full bg-[#0a2e8c]/10 text-[#0a2e8c] font-black text-xs grid place-items-center shrink-0">
              {user?.name?.[0] || 'V'}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 block truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-400 block truncate">{store.storeName}</span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ================= MAIN DASHBOARD BODY ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Store:</span>
            <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Store size={15} className="text-[#0a2e8c]" />
              {store.storeName}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500" />
            </button>
            <div className="size-8 rounded-full bg-[#0a2e8c] text-white font-black text-xs grid place-items-center">
              {user?.name?.[0] || 'V'}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="p-6 sm:p-8 space-y-6">
          {/* Urgent Restock Warning Alert (Matching Mockup 5) */}
          {!bannerDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-[#ea580c] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="block font-black text-sm">
                    Stockout Warning: 3 High-Velocity SKUs Running Low
                  </strong>
                  <span>
                    Restock recommended within 48 hours to prevent search ranking suppression across ShopVerse marketplace.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/vendor/products"
                  className="px-4 py-2 rounded-xl bg-[#9a3412] hover:bg-[#7c2d12] text-white text-xs font-black transition shadow-xs"
                >
                  Restock Inventory
                </Link>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="text-white/80 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* 4 Top KPI Cards (Matching Mockup 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Gross Revenue */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>GROSS REVENUE (MTD)</span>
                <span className="p-2 rounded-xl bg-blue-50 text-[#0a2e8c]">
                  <CreditCard size={18} />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-950">
                ₹{Number(metrics.totalRevenue || 48294.5).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <ArrowUpRight size={14} />
                <span>+12.4% vs previous month</span>
              </div>
            </div>

            {/* Card 2: Total Orders */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>TOTAL ORDERS</span>
                <span className="p-2 rounded-xl bg-blue-50 text-[#0a2e8c]">
                  <ShoppingBag size={18} />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-950">
                {metrics.pendingOrders ? Number(metrics.pendingOrders).toLocaleString('en-IN') : '1,428'}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0a2e8c]">
                <TrendingUp size={14} />
                <span>+8.2% fulfillment rate</span>
              </div>
            </div>

            {/* Card 3: Buy Box Win Rate */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>BUY BOX WIN RATE</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck size={18} />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-950">94.2%</div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Optimized across 45 SKUs</span>
              </div>
            </div>

            {/* Card 4: Store Rating */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>STORE RATING</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Star size={18} className="fill-rose-500" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-950">4.9 / 5.0</div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#0a2e8c]">312 New Reviews</span>
                <span className="text-slate-400 font-normal">this week</span>
              </div>
            </div>
          </div>

          {/* Middle Row: Revenue & Velocity (2 cols) + Store Health (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: Revenue & Sales Velocity */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-950">Revenue &amp; Sales Velocity</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time performance analytics across ShopVerse fulfillment nodes
                  </p>
                </div>

                {/* Range Toggle */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 text-xs font-bold">
                  {['7D', '30D', '1Y'].map((r) => {
                    const active = range.toUpperCase() === r
                    return (
                      <button
                        key={r}
                        onClick={() => setRange(r.toLowerCase())}
                        className={`px-3 py-1 rounded-lg transition ${
                          active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bar Chart Mockup matching Stitch */}
              <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
                {[
                  { label: 'Mon', h1: '40%', h2: '20%' },
                  { label: 'Tue', h1: '60%', h2: '35%' },
                  { label: 'Wed', h1: '50%', h2: '25%' },
                  { label: 'Thu', h1: '75%', h2: '45%' },
                  { label: 'Fri', h1: '90%', h2: '60%' },
                  { label: 'Sat', h1: '70%', h2: '50%' },
                  { label: 'Sun', h1: '100%', h2: '75%', highlight: '₹12,450 Today' },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full max-w-[40px] bg-slate-100 rounded-xl overflow-hidden flex flex-col justify-end h-full p-1 relative group">
                      {bar.highlight && (
                        <span className="absolute -top-7 text-[10px] font-black text-[#0a2e8c] bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {bar.highlight}
                        </span>
                      )}
                      <div
                        className="w-full bg-[#0a2e8c] rounded-lg transition-all duration-500"
                        style={{ height: bar.h1 }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{bar.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-[#0a2e8c]" />
                  <span>Direct Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-slate-300" />
                  <span>FBA / Partner Nodes</span>
                </div>
              </div>
            </div>

            {/* Right: Store Health Compliance Metrics */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
              <h3 className="text-base font-black text-slate-950 border-b border-slate-100 pb-3">
                Store Health
              </h3>
              <p className="text-xs text-slate-500">Compliance &amp; performance metrics</p>

              <div className="space-y-3">
                {/* Metric 1 */}
                <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck size={18} className="text-[#0a2e8c]" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Order Defect Rate</div>
                      <div className="text-[10px] text-slate-400">Target: &lt; 1.0%</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100/70 text-[#0a2e8c] font-black text-xs">
                    0.12% (Good)
                  </span>
                </div>

                {/* Metric 2 */}
                <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={18} className="text-[#0a2e8c]" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Late Dispatch Rate</div>
                      <div className="text-[10px] text-slate-400">Target: &lt; 4.0%</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100/70 text-[#0a2e8c] font-black text-xs">
                    0.45% (Great)
                  </span>
                </div>

                {/* Metric 3 */}
                <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-[#0a2e8c]" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Valid Tracking Rate</div>
                      <div className="text-[10px] text-slate-400">Target: &gt; 95%</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 font-black text-xs">
                    99.8%
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-3 rounded-2xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-black transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>View Full Health Report</span>
              </button>
            </div>
          </div>

          {/* Bottom Table: Recent Customer Orders (Matching Mockup 5) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-950">Recent Customer Orders</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage incoming fulfillments and dispatch status updates
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search order ID or custom..."
                    value={searchOrderQuery}
                    onChange={(e) => setSearchOrderQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none w-48 sm:w-60 text-slate-800"
                  />
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Filter size={13} />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Product SKU</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Dispatch Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 font-bold text-[#0a2e8c]">{ord.id}</td>
                      <td className="py-4">
                        <div className="font-bold text-slate-900">{ord.customer}</div>
                        <div className="text-[10px] text-slate-400">{ord.location}</div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2.5">
                          <img src={ord.skuImage} alt="" className="size-8 rounded-lg object-cover" />
                          <div>
                            <div className="font-bold text-slate-900 truncate max-w-[180px]">{ord.skuName}</div>
                            <div className="text-[10px] text-slate-400">SKU: {ord.skuCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-bold text-slate-700">{ord.quantity}</td>
                      <td className="py-4 font-black text-slate-950">₹{ord.total}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${ord.statusClass}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          to="/vendor/orders"
                          className="px-4 py-1.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white font-bold text-xs transition shadow-2xs cursor-pointer inline-block"
                        >
                          {ord.actionLabel}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing 3 of 1,428 orders</span>
              <div className="flex items-center gap-1">
                <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                  Previous
                </button>
                <button className="px-2.5 py-1 rounded-lg bg-[#0a2e8c] text-white font-bold">1</button>
                <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                  2
                </button>
                <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
