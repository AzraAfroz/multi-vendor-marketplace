import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Heart,
  Layers,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  X,
  Zap,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import { useCart } from '../../context/CartContext.jsx'
import { useDeliveryLocation } from '../../context/LocationContext.jsx'

export default function ShoppingHeader({
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  isBrowsing = false,
}) {
  const { user, isAuthenticated, logout } = useAuth()
  const { cartCount, cartSubtotal, setIsCartOpen, wishlistCount, setIsWishlistOpen } = useCart()
  const { location, setIsLocationModalOpen } = useDeliveryLocation()
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [departmentsOpen, setDepartmentsOpen] = useState(false)

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // ignore
    }
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-[0_2px_12px_rgba(10,46,140,0.04)] font-sans">
      {/* ================= MAIN BRAND, SEARCH & ACTIONS BAR ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline group"
            aria-label="ShopVerse Home"
          >
            <div className="size-9 sm:size-10 rounded-xl bg-[#0a2e8c] text-white flex items-center justify-center shadow-md group-hover:bg-[#07226b] transition-all">
              <ShoppingBag size={20} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-[#0a2e8c] leading-none">
                Shop<span className="text-slate-900">Verse</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5 hidden sm:block">
                Multi-Vendor Marketplace
              </span>
            </div>
          </Link>

          {/* Location Picker */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 hover:border-[#0a2e8c] hover:bg-blue-50/20 transition cursor-pointer text-left"
            title="Change delivery location"
          >
            <MapPin size={15} className="text-[#0a2e8c] shrink-0" />
            <div className="leading-tight">
              <span className="text-[10px] text-slate-400 block font-medium">Deliver to</span>
              <span className="font-bold text-slate-800">
                {location.city} {location.pincode ? `(${location.pincode})` : ''}
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Bar with Integrated Category Selector */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (onSearchSubmit) onSearchSubmit()
          }}
          className="flex-1 max-w-2xl hidden md:flex items-center rounded-xl border border-slate-300 bg-slate-50/80 hover:bg-white focus-within:bg-white focus-within:border-[#0a2e8c] focus-within:ring-3 focus-within:ring-[#0a2e8c]/15 transition shadow-xs overflow-hidden"
        >
          {/* Integrated Categories Dropdown */}
          <div className="flex items-center pl-3.5 pr-2 border-r border-slate-200 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory && onSelectCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer py-2.5 max-w-[140px] truncate"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 flex items-center">
            <input
              type="search"
              placeholder="Search products across all approved vendor stores..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Search Action Button */}
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#0a2e8c] hover:bg-[#07226b] text-white transition flex items-center justify-center cursor-pointer shadow-xs shrink-0"
            aria-label="Search"
          >
            <Search size={17} strokeWidth={2.5} />
          </button>
        </form>

        {/* Right Header Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Currency Pill */}
          <div className="hidden lg:flex items-center text-xs font-bold text-slate-700 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200">
            <span>USD $</span>
          </div>

          {/* Returns & Orders Link */}
          <Link
            to={isAuthenticated ? '/orders' : '/login'}
            className="hidden lg:flex flex-col text-right text-xs leading-tight hover:text-[#0a2e8c] transition"
          >
            <span className="text-[10px] text-slate-400 font-medium">Returns</span>
            <span className="font-bold text-slate-800">&amp; Orders</span>
          </Link>

          {/* User Account Menu */}
          <div className="relative">
            {isAuthenticated ? (
              <div>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 text-left text-xs text-slate-700 hover:text-[#0a2e8c] transition p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  <div className="size-8 rounded-full bg-[#0a2e8c]/10 border border-[#0a2e8c]/20 grid place-items-center text-[#0a2e8c] font-black text-xs">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden xl:block leading-tight">
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Hello, {user?.name?.split(' ')[0]}
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-0.5">
                      Account &amp; Lists <ChevronDown size={11} />
                    </span>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
                      <strong className="block text-slate-900 font-bold truncate">{user?.name}</strong>
                      <span className="text-[11px] text-slate-400 truncate block">{user?.email}</span>
                      <span className="inline-block mt-1.5 uppercase text-[9px] font-extrabold px-2 py-0.5 bg-[#0a2e8c]/10 text-[#0a2e8c] rounded-full">
                        {user?.role} Portal
                      </span>
                    </div>

                    {user?.role === 'vendor' && (
                      <Link
                        to="/vendor/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        <Store size={14} className="text-[#0a2e8c]" /> Vendor Dashboard
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        <ShieldCheck size={14} className="text-[#0a2e8c]" /> Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/account"
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                      <User size={14} /> My Account Overview
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                      <Package size={14} /> My Orders &amp; Tracking
                    </Link>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 font-bold cursor-pointer"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-[#0a2e8c] transition p-1.5 rounded-xl hover:bg-slate-50"
              >
                <div className="size-8 rounded-full bg-slate-100 border border-slate-200 grid place-items-center text-slate-600">
                  <User size={15} />
                </div>
                <div className="hidden xl:block leading-tight">
                  <span className="text-[10px] text-slate-400 block font-normal">Welcome</span>
                  <span className="font-bold text-slate-900">Sign In / Register</span>
                </div>
              </Link>
            )}
          </div>

          {/* Wishlist Icon Button */}
          <button
            type="button"
            onClick={() => setIsWishlistOpen(true)}
            className="relative p-2.5 text-slate-700 hover:text-[#0a2e8c] hover:bg-slate-50 rounded-xl transition cursor-pointer"
            aria-label="Wishlist"
            title="View Wishlist"
          >
            <Heart size={21} />
            {wishlistCount > 0 && (
              <span className="absolute top-1.5 right-1 size-4 rounded-full bg-rose-600 text-white font-black text-[9px] grid place-items-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Trigger Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-xl bg-[#0a2e8c]/8 hover:bg-[#0a2e8c]/15 text-[#0a2e8c] border border-[#0a2e8c]/20 transition cursor-pointer active:scale-95 shadow-2xs"
            aria-label="View shopping cart"
          >
            <div className="relative">
              <ShoppingBag size={20} className="stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 size-4 rounded-full bg-[#0a2e8c] text-white font-black text-[9px] grid place-items-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left text-xs leading-none">
              <span className="text-[9px] text-[#0a2e8c]/80 font-bold uppercase block mb-0.5">Cart</span>
              <span className="font-extrabold text-slate-950">₹{cartSubtotal}</span>
            </div>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl md:hidden cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ================= SECOND ROW: DEPARTMENTS & UTILITY BAR ================= */}
      <nav className="bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
          {/* Left: All Departments + Category Pills */}
          <div className="flex items-center gap-2 sm:gap-5 overflow-x-auto no-scrollbar whitespace-nowrap py-0.5">
            {/* All Departments Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setDepartmentsOpen(!departmentsOpen)
                if (onSelectCategory) onSelectCategory('all')
              }}
              className="inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-[#0a2e8c] bg-slate-100/90 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
            >
              <Menu size={14} strokeWidth={2.5} />
              <span>All Departments</span>
            </button>

            {/* Quick Category Links matching Stitch mockup */}
            <button
              type="button"
              onClick={() => onSelectCategory && onSelectCategory('all')}
              className={`font-semibold transition cursor-pointer px-1 py-1 ${
                isBrowsing && !selectedCategory
                  ? 'text-[#0a2e8c] font-extrabold border-b-2 border-[#0a2e8c]'
                  : 'text-slate-600 hover:text-[#0a2e8c]'
              }`}
            >
              All Items
            </button>

            {categories.slice(0, 7).map((cat) => {
              const isSelected = selectedCategory === (cat.id || cat._id)
              return (
                <button
                  key={cat.id || cat._id}
                  type="button"
                  onClick={() => onSelectCategory && onSelectCategory(cat.id || cat._id)}
                  className={`font-semibold transition cursor-pointer px-1 py-1 ${
                    isSelected
                      ? 'text-[#0a2e8c] font-extrabold border-b-2 border-[#0a2e8c]'
                      : 'text-slate-600 hover:text-[#0a2e8c]'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => onSelectCategory && onSelectCategory('deals')}
              className="text-slate-600 hover:text-[#0a2e8c] font-semibold transition cursor-pointer px-1 py-1 flex items-center gap-1"
            >
              <Zap size={13} className="text-amber-500 fill-amber-500" />
              <span>Today's Deals</span>
            </button>
          </div>

          {/* Right: Become a Vendor Orange CTA */}
          <div className="hidden sm:flex items-center shrink-0">
            {user?.role === 'vendor' ? (
              <Link
                to="/vendor/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0a2e8c]/30 text-[#0a2e8c] bg-[#0a2e8c]/5 hover:bg-[#0a2e8c]/10 text-xs font-bold transition shadow-2xs"
              >
                <Store size={13} />
                <span>Vendor Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/vendor/onboarding"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-400/80 text-orange-600 bg-orange-50/70 hover:bg-orange-100/80 text-xs font-extrabold transition shadow-2xs"
              >
                <Store size={13} />
                <span>Become a Vendor</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ================= MOBILE EXPANDED MENU ================= */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-4 text-xs animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (onSearchSubmit) onSearchSubmit()
              setMobileMenuOpen(false)
            }}
            className="flex items-center rounded-xl border border-slate-300 bg-slate-50 overflow-hidden"
          >
            <input
              type="search"
              placeholder="Search products & stores..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-xs text-slate-800 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0a2e8c] text-white flex items-center justify-center"
            >
              <Search size={15} />
            </button>
          </form>

          {/* Mobile Departments */}
          <div>
            <div className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider mb-2">
              Browse Departments
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onSelectCategory) onSelectCategory('')
                  setMobileMenuOpen(false)
                }}
                className="text-left py-1.5 px-2.5 rounded-lg bg-slate-50 text-slate-800 hover:bg-[#0a2e8c]/10 font-bold"
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id || cat._id}
                  type="button"
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(cat.id || cat._id)
                    setMobileMenuOpen(false)
                  }}
                  className="text-left py-1.5 px-2.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-[#0a2e8c]/10 truncate font-medium"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Account links */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block font-bold text-slate-800"
                >
                  My Account ({user?.name})
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-slate-600 font-semibold"
                >
                  My Orders &amp; Tracking
                </Link>
                {user?.role === 'vendor' && (
                  <Link
                    to="/vendor/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-[#0a2e8c] font-bold"
                  >
                    Vendor Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-rose-600 font-bold pt-1"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-[#0a2e8c] text-white font-bold rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-slate-100 text-slate-800 font-bold rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
