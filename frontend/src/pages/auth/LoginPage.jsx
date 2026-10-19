import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Store, User } from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import { apiErrorMessage } from '../../services/authService.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [visible, setVisible] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const update = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  // Quick Demo Autofills for testing
  function fillRole(role) {
    if (role === 'vendor') {
      setValues({ email: 'azraafroz859@gmail.com', password: 'Vendor123!' })
    } else if (role === 'admin') {
      setValues({ email: 'admin@marketplace.com', password: 'Admin123!' })
    } else {
      setValues({ email: 'customer@example.com', password: 'Customer123!' })
    }
    setNotice('')
    setErrors({})
  }

  async function submit(e) {
    e.preventDefault()
    setNotice('')
    const next = {}
    if (!emailPattern.test(values.email.trim())) {
      next.email = 'Enter a valid email address.'
    }
    if (!values.password) {
      next.password = 'Enter your password.'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const result = await login({ ...values })
      const targetRoute =
        result.user.role === 'admin'
          ? '/admin/dashboard'
          : result.user.role === 'vendor'
          ? '/vendor/dashboard'
          : '/account'
      navigate(targetRoute, { replace: true, state: { message: result.message } })
    } catch (error) {
      setNotice(apiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-md w-full mx-auto font-sans">
      {/* Top Segmented Tabs [ Sign In | Create Account ] */}
      <div className="p-1 rounded-2xl bg-slate-100 flex items-center text-xs font-bold">
        <button
          type="button"
          className="flex-1 py-2.5 rounded-xl bg-white text-slate-900 shadow-sm transition"
        >
          Sign In
        </button>
        <Link
          to="/register"
          className="flex-1 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 text-center transition"
        >
          Create Account
        </Link>
      </div>

      {/* Heading & Subtitle */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
          Sign in to your account
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Enter your credentials to access your orders, wishlist, and vendor messages.
        </p>
      </div>

      {/* Social Logins (Google & Apple ID) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => fillRole('customer')}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => fillRole('vendor')}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
        >
          <svg className="size-4 fill-slate-900" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96 1-3.1-.98.04-2.17.65-2.87 1.47-.61.71-1.15 1.87-1.01 2.98 1.1.09 2.22-.53 2.88-1.35z" />
          </svg>
          <span>Apple ID</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center text-xs text-slate-400">
        <div className="w-full border-t border-slate-200" />
        <span className="bg-white px-3 text-[11px] font-medium absolute">or sign in with email</span>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold" role="alert">
          {notice}
        </div>
      )}

      {/* Main Credentials Form */}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={update}
              placeholder="sarah.johnson@example.com"
              autoComplete="email"
              className={`w-full h-12 pl-10 pr-3 text-xs bg-slate-50 border rounded-xl outline-none transition focus:bg-white focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15 text-slate-900 ${
                errors.email ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {errors.email && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-[11px] text-[#0a2e8c] hover:underline font-bold">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={visible ? 'text' : 'password'}
              name="password"
              value={values.password}
              onChange={update}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className={`w-full h-12 pl-10 pr-10 text-xs bg-slate-50 border rounded-xl outline-none transition focus:bg-white focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15 text-slate-900 ${
                errors.password ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.password}</p>}
        </div>

        {/* Remember me */}
        <div className="pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-[#0a2e8c] focus:ring-[#0a2e8c]"
            />
            <span>Remember this device for 30 days</span>
          </label>
        </div>

        {/* Big Deep Royal Blue CTA Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{loading ? 'Signing In…' : 'Sign In to ShopVerse'}</span>
          <ArrowRight size={15} />
        </button>
      </form>

      {/* Quick Demo Autofills */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[10px] uppercase font-bold text-slate-400 block text-center mb-2 tracking-wider">
          Quick Demo Autofills
        </span>
        <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => fillRole('customer')}
            className="hover:text-[#0a2e8c] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            Shopper
          </button>
          <button
            type="button"
            onClick={() => fillRole('vendor')}
            className="hover:text-[#0a2e8c] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            Vendor
          </button>
          <button
            type="button"
            onClick={() => fillRole('admin')}
            className="hover:text-[#0a2e8c] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            Admin
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center leading-relaxed">
        Protected by reCAPTCHA and subject to the ShopVerse Privacy Policy and Terms of Service.
      </p>
    </div>
  )
}
