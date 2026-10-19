import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Users,
  X,
} from 'lucide-react'
import useAuth from '../hooks/useAuth.js'
import { getAdminDashboardMetrics } from '../services/dashboardService.js'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [metricsSummary, setMetricsSummary] = useState({
    pendingReviews: 0,
    totalOrders: 0,
    productsListed: 0,
  })

  useEffect(() => {
    let mounted = true
    getAdminDashboardMetrics('30d')
      .then((data) => {
        if (mounted && data?.metrics) {
          setMetricsSummary({
            pendingReviews: data.metrics.pendingReviews || 0,
            totalOrders: data.metrics.totalOrders || 0,
            productsListed: data.metrics.productsListed || 0,
          })
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [location.pathname])

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // ignore
    }
    navigate('/login')
  }

  const navLinks = [
    {
      to: '/admin/dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/admin/orders',
      label: 'Orders & Fulfillment',
      icon: ShoppingBag,
      badge: metricsSummary.totalOrders > 0 ? String(metricsSummary.totalOrders) : null,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      to: '/admin/vendors',
      label: 'Vendor Verification',
      icon: Store,
      badge: metricsSummary.pendingReviews > 0 ? `${metricsSummary.pendingReviews} pending` : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      to: '/admin/categories',
      label: 'Catalog & Taxonomy',
      icon: Layers,
      badge: null,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-[#0a2e8c]/15 selection:text-[#0a2e8c]">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex w-64 bg-[#0a1226] text-white flex-col flex-shrink-0 min-h-screen sticky top-0 shadow-2xl border-r border-slate-800/80 z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-[#080d1d]">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 text-white no-underline group">
            <div className="size-9 rounded-xl bg-gradient-to-br from-[#0a2e8c] via-[#1d4ed8] to-[#0284c7] text-white font-black text-lg grid place-items-center shadow-md shadow-blue-900/40 group-hover:scale-105 transition-transform">
              S
            </div>
            <div className="leading-tight">
              <span className="font-black text-base tracking-tight block text-white">
                ShopVerse
              </span>
              <span className="text-[9px] text-[#38bdf8] uppercase tracking-widest font-mono font-bold">
                ENTERPRISE CONTROL
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              CORE PLATFORM
            </div>

            {navLinks.map((item) => {
              const Icon = item.icon
              const isActive =
                item.to === '/admin/dashboard'
                  ? location.pathname === '/admin/dashboard' || location.pathname === '/admin'
                  : location.pathname.startsWith(item.to)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0a2e8c] to-[#1d4ed8] text-white shadow-md shadow-blue-950/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>

          {/* Secondary Shortcuts */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              STOREFRONT SHORTCUTS
            </div>

            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <div className="flex items-center gap-3">
                <Store size={17} className="text-slate-400" />
                <span>Customer Marketplace</span>
              </div>
              <ArrowUpRight size={14} className="text-slate-500" />
            </Link>

            <Link
              to="/products"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <div className="flex items-center gap-3">
                <Package size={17} className="text-slate-400" />
                <span>Live Catalog Grid</span>
              </div>
              <ArrowUpRight size={14} className="text-slate-500" />
            </Link>
          </div>
        </div>

        {/* User Card & Logout Bottom Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#080d1d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-9 rounded-xl bg-gradient-to-br from-[#0a2e8c] to-[#0284c7] text-white font-black text-xs grid place-items-center shrink-0 shadow-xs">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="leading-tight truncate">
                <p className="text-xs font-extrabold text-white truncate">{user?.name || 'Administrator'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-mono font-medium">Super Admin</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE SIDEBAR DRAWER ================= */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-[#0a1226] text-white flex flex-col z-50 lg:hidden shadow-2xl"
            >
              <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-[#080d1d]">
                <span className="font-black text-lg tracking-tight text-white flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-[#0a2e8c] text-white font-black text-sm grid place-items-center">
                    S
                  </div>
                  ShopVerse Admin
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navLinks.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.to === '/admin/dashboard'
                      ? location.pathname === '/admin/dashboard' || location.pathname === '/admin'
                      : location.pathname.startsWith(item.to)

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-[#0a2e8c] text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={17} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>

              <div className="p-4 border-t border-slate-800 bg-[#080d1d]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= MAIN APPLICATION CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Left: Mobile hamburger & Context title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="font-bold text-[#0a2e8c]">Enterprise Admin</span>
              <span>/</span>
              <span className="capitalize text-slate-800 font-bold">
                {location.pathname.replace('/admin/', '').replace('/', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Platform Beacon */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Vendor Engine Active</span>
            </div>

            {/* Visit Store Button */}
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#0a2e8c] hover:text-[#0a2e8c] bg-white text-slate-700 text-xs font-bold transition shadow-2xs"
            >
              <Store size={14} className="text-[#0a2e8c]" />
              <span>Storefront</span>
              <ArrowUpRight size={13} className="text-slate-400" />
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {metricsSummary.pendingReviews > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 bg-amber-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="size-7 rounded-lg bg-[#0a2e8c] text-white font-black text-xs grid place-items-center">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <span className="font-bold text-slate-900 block truncate max-w-[100px]">
                    {user?.name || 'Admin'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs font-medium animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0a2e8c]"
                    >
                      Executive Dashboard
                    </Link>
                    <Link
                      to="/admin/vendors"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0a2e8c]"
                    >
                      Vendor Approvals
                    </Link>
                    <Link
                      to="/admin/categories"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0a2e8c]"
                    >
                      Manage Catalog
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left font-bold"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
