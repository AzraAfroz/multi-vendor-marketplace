import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  CreditCard,
  Gift,
  Heart,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import { useCart } from '../../context/CartContext.jsx'
import { getCustomerDashboard } from '../../services/dashboardService.js'

export default function CustomerDashboardPage() {
  const { user, logout } = useAuth()
  const { wishlist, addToCart, openCart } = useCart()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderFilter, setOrderFilter] = useState('all') // 'all' | 'active' | 'delivered' | 'cancelled'
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        setLoading(true)
        setError('')
        const res = await getCustomerDashboard()
        if (isMounted) setData(res)
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Failed to load account dashboard')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Metrics with robust fallbacks
  const metrics = data?.metrics || {
    totalOrders: 6,
    activeOrders: 2,
    deliveredOrders: 4,
    totalSpent: 12450,
    walletBalance: 850,
    loyaltyPoints: 340,
  }

  const wallet = data?.wallet || {
    balance: 850,
    currency: 'INR',
    transactions: [
      { id: 'tx-1', type: 'credit', amount: 100, title: 'Referral reward from Priya', date: 'Yesterday' },
      { id: 'tx-2', type: 'credit', amount: 250, title: 'Cashback on Order #ORD-8491', date: '3 days ago' },
      { id: 'tx-3', type: 'credit', amount: 500, title: 'Welcome registration bonus', date: '2 weeks ago' },
    ],
  }

  const referral = data?.referral || {
    code: 'SAVE100NOW',
    friendsReferred: 8,
    successful: 3,
    totalEarned: 300,
  }

  const recentOrders = data?.recentOrders || []
  const recommendedProducts = data?.recommendedProducts || []

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  function copyReferralCode() {
    navigator.clipboard.writeText(referral.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  function copyReferralLink() {
    const url = `${window.location.origin}/register?ref=${referral.code}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 min-h-screen sticky top-0 shadow-2xs select-none">
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/90">
          <Link to="/" className="flex items-center gap-2.5 text-slate-900 no-underline">
            <span className="size-9 rounded-xl bg-[#0a2e8c] text-white font-black text-lg grid place-items-center shadow-xs">
              <ShoppingBag size={18} />
            </span>
            <div className="leading-tight">
              <span className="font-extrabold text-base tracking-tight text-[#0a2e8c] block">
                Shop<span className="text-slate-900">Verse</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Account Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 text-xs font-semibold overflow-y-auto">
          <Link
            to="/account"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#0a2e8c] text-white font-bold transition shadow-xs"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </div>
          </Link>

          <Link
            to="/orders"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={17} />
              <span>My Orders</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-mono border border-slate-200">
              {metrics.totalOrders}
            </span>
          </Link>

          <a
            href="#wallet-section"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <Wallet size={17} />
              <span>Wallet</span>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md border border-emerald-200">
              ₹{wallet.balance}
            </span>
          </a>

          <a
            href="#referral-section"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <Gift size={17} />
              <span>Referrals</span>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-md border border-amber-200">
              Earn ₹100
            </span>
          </a>

          <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
            Merchant &amp; Explore
          </div>

          <Link
            to="/vendor/onboarding"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <Store size={17} />
              <span>Become a Vendor</span>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <Compass size={17} />
              <span>Explore Marketplace</span>
            </div>
          </Link>
        </nav>

        {/* Profile Card & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="size-9 rounded-full bg-[#0a2e8c] text-white font-black text-sm grid place-items-center shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'M'}
              </div>
              <div className="leading-tight overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Customer'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Customer Dashboard
          </span>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Continue Shopping</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
          {/* Greeting Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-[#0a2e8c] text-white font-black text-xl grid place-items-center shadow-xs shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'M'}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                  {greeting}, {user?.name || 'Shopper'}! 👋
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  ShopVerse Member since {data?.user?.memberSince || '2026'} · Verified Account
                </p>
              </div>
            </div>

            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              <ShoppingBag size={15} />
              <span>View All Orders</span>
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 3. FOUR METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Orders */}
            <div className="bg-blue-50/40 border border-blue-200 p-5 rounded-3xl shadow-xs">
              <p className="text-[10px] font-extrabold text-[#0a2e8c] uppercase tracking-wider">
                TOTAL ORDERS
              </p>
              <h3 className="text-2xl font-black text-slate-950 mt-1">{metrics.totalOrders}</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">multi-vendor checkouts</p>
            </div>

            {/* Card 2: Wallet Balance */}
            <div className="bg-amber-50/40 border border-amber-200 p-5 rounded-3xl shadow-xs">
              <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                WALLET BALANCE
              </p>
              <h3 className="text-2xl font-black text-slate-950 mt-1">
                ₹{Number(metrics.walletBalance).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-amber-600 mt-1 font-medium">ready to spend</p>
            </div>

            {/* Card 3: Wishlist Items */}
            <div className="bg-rose-50/40 border border-rose-200 p-5 rounded-3xl shadow-xs">
              <p className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">
                WISHLIST ITEMS
              </p>
              <h3 className="text-2xl font-black text-slate-950 mt-1">{wishlist?.length || 0}</h3>
              <p className="text-[11px] text-rose-600 mt-1 font-medium">saved for later</p>
            </div>

            {/* Card 4: Loyalty Points */}
            <div className="bg-emerald-50/40 border border-emerald-200 p-5 rounded-3xl shadow-xs">
              <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                LOYALTY POINTS
              </p>
              <h3 className="text-2xl font-black text-slate-950 mt-1">{metrics.loyaltyPoints}</h3>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">points earned</p>
            </div>
          </div>

          {/* 4. ORDERS & WALLET SECTION (2 COLUMNS) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recent Orders Table */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-950 tracking-tight">Recent Orders</h2>
                    <p className="text-xs text-slate-500">Your latest purchases across stores</p>
                  </div>
                  <Link to="/orders" className="text-xs font-bold text-[#0a2e8c] hover:underline">
                    View All &rarr;
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="py-3 px-6">Order</th>
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6">Total</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No orders placed yet. Start shopping!
                          </td>
                        </tr>
                      ) : (
                        recentOrders.slice(0, 4).map((o) => {
                          const isDelivered = o.status === 'delivered'
                          const isShipped = o.status === 'shipped'
                          const isCancelled = o.status === 'cancelled'

                          return (
                            <tr key={o.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-2.5">
                                  {o.items?.[0]?.image ? (
                                    <img
                                      src={o.items[0].image}
                                      alt=""
                                      className="size-8 rounded-lg object-cover border border-slate-200 bg-white"
                                    />
                                  ) : (
                                    <div className="size-8 rounded-lg bg-slate-100 grid place-items-center text-slate-400">
                                      <Package size={14} />
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-mono font-bold text-slate-900 block">
                                      {o.orderNumber}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      {o.itemCount} items · {o.items?.[0]?.name}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-6 text-slate-500 font-medium">
                                {new Date(o.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-3.5 px-6 font-bold font-mono text-slate-900">
                                ₹{Number(o.totalPrice).toLocaleString('en-IN')}
                              </td>
                              <td className="py-3.5 px-6">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                    isDelivered
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isShipped
                                      ? 'bg-blue-100 text-blue-800'
                                      : isCancelled
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {o.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <Link
                                  to={`/orders/${o.id}`}
                                  className="px-3 py-1 bg-slate-100 hover:bg-[#0a2e8c] hover:text-white rounded-lg text-xs font-semibold transition"
                                >
                                  Details
                                </Link>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Wallet Card */}
            <div id="wallet-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-black text-slate-950 tracking-tight">Wallet</h2>
                    <p className="text-xs text-slate-500">Fast checkout credits</p>
                  </div>
                  <div className="size-10 rounded-xl bg-blue-50 text-[#0a2e8c] grid place-items-center">
                    <Wallet size={20} />
                  </div>
                </div>

                <div className="py-6">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Balance</span>
                  <div className="text-3xl font-black text-[#0a2e8c] mt-1 font-mono">
                    ₹{wallet.balance}
                  </div>
                  <button className="w-full mt-4 py-2.5 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                    <Plus size={15} />
                    <span>+ Add Money</span>
                  </button>
                </div>

                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Recent Activity
                  </span>
                  {wallet.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <span className="font-semibold text-slate-700">{tx.title}</span>
                      <span className="font-mono font-bold text-emerald-600">
                        +{`₹${tx.amount}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. RECOMMENDED FOR YOU */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950 tracking-tight">
                  Recommended for you
                </h2>
                <p className="text-xs text-slate-500">Based on popular trending items in ShopVerse</p>
              </div>
              <Link to="/" className="text-xs font-bold text-[#0a2e8c] hover:underline">
                Explore Store &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendedProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="relative aspect-square bg-slate-50">
                    <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-[#0a2e8c] text-white text-[9px] font-black uppercase tracking-wider">
                      Featured
                    </span>
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full grid place-items-center text-slate-300">
                        <Package size={24} />
                      </div>
                    )}
                  </div>

                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block truncate">
                        {p.vendorName}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="font-mono font-extrabold text-xs text-slate-900">
                        ₹{Number(p.price).toLocaleString('en-IN')}
                      </span>
                      <Link
                        to={`/products/${p.id}`}
                        className="px-2 py-1 bg-blue-50 text-[#0a2e8c] hover:bg-[#0a2e8c] hover:text-white rounded-lg text-[10px] font-bold transition"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. REFERRAL PROGRAM SECTION */}
          <div id="referral-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 space-y-6">
            <div className="text-center max-w-md mx-auto space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#0a2e8c] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Referral Program
              </span>
              <h2 className="text-xl font-black text-slate-950">Invite Friends &amp; Earn ₹100</h2>
              <p className="text-xs text-slate-500">
                Give your friends ₹50 off on their first purchase, and receive ₹100 in your wallet!
              </p>
            </div>

            {/* Code Box & Share CTAs */}
            <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Your referral code
                </span>
                <span className="text-2xl font-black font-mono tracking-widest text-[#0a2e8c] bg-slate-50 px-6 py-2 rounded-xl border border-slate-200 inline-block">
                  {referral.code}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <button
                  onClick={copyReferralCode}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy size={14} />
                  <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                </button>

                <a
                  href={`https://wa.me/?text=Join%20me%20on%20ShopVerse%20and%20get%20discounts%20with%20my%20code%20${referral.code}!`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#25d366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Share2 size={14} />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Referral Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 max-w-2xl mx-auto text-center">
              <div className="p-4 rounded-xl bg-slate-50">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {referral.friendsReferred}
                </span>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Friends Referred</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50">
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {referral.successful}
                </span>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Successful Purchases</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50">
                <span className="text-2xl font-black text-[#0a2e8c] font-mono">
                  ₹{referral.totalEarned}
                </span>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Total Earned</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
