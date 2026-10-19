import { Check, Lock, ShieldCheck, ShoppingBag, Star } from 'lucide-react'
import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-[#f3f4f8] flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* ================= LEFT VISUAL PANEL (MATCHING STITCH MOCKUP 3) ================= */}
        <section className="lg:col-span-5 bg-gradient-to-br from-[#0a2e8c] via-[#0c329a] to-[#041445] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Background Ambient Orbs */}
          <div className="absolute -top-16 -right-16 size-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 no-underline group">
              <span className="size-10 rounded-xl bg-white text-[#0a2e8c] grid place-items-center shadow-md">
                <ShoppingBag size={22} className="stroke-[2.5]" />
              </span>
              <span className="text-2xl font-black tracking-tight text-white font-sans">
                Shop<span className="text-cyan-300">Verse</span>
              </span>
            </Link>
          </div>

          {/* Center Copy & Ecosystem Highlights */}
          <div className="relative z-10 my-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-cyan-200 text-xs font-black tracking-wide backdrop-blur-xs">
              <ShieldCheck size={14} className="text-cyan-300" />
              <span>SECURE MULTI-VENDOR ECOSYSTEM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Welcome to the future of retail.
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-sm">
              Manage your multi-vendor orders, track verified global shipments, access exclusive wholesale pricing, and connect directly with thousands of independent boutique stores.
            </p>

            {/* Verified Satisfaction Card */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-black text-white">99.8%</div>
                  <div className="text-[11px] text-slate-300">Verified Satisfaction</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star size={13} className="fill-amber-400" />
                    <Star size={13} className="fill-amber-400" />
                    <Star size={13} className="fill-amber-400" />
                    <Star size={13} className="fill-amber-400" />
                    <Star size={13} className="fill-amber-400" />
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">4.9 / 5.0 Rating</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-300 border-t border-white/10 pt-2 mt-1">
                Over 2.4M successful marketplace orders across certified sellers.
              </p>
            </div>
          </div>

          {/* Bottom Security Badges */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <Lock size={12} className="text-cyan-300" /> 256-Bit SSL Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-cyan-300" /> Buyer Protection Program
            </span>
          </div>
        </section>

        {/* ================= RIGHT FORM PANEL (OUTLET) ================= */}
        <section className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <Outlet />

          <footer className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>© 2026 ShopVerse Inc. All rights reserved.</span>
            <Link to="/" className="text-[#0a2e8c] hover:underline font-bold">
              Visit Marketplace &rarr;
            </Link>
          </footer>
        </section>
      </div>
    </main>
  )
}
