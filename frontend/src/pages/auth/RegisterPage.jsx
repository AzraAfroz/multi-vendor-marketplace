import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react'
import { apiErrorMessage, registerRequest } from '../../services/authService.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const update = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  async function submit(e) {
    e.preventDefault()
    setNotice('')
    const next = {}
    if (values.name.trim().length < 2) next.name = 'Enter your full name.'
    if (!emailPattern.test(values.email.trim())) next.email = 'Enter a valid email address.'
    if (values.phone.replace(/\D/g, '').length < 7) next.phone = 'Enter a valid phone number.'
    if (values.password.length < 8) next.password = 'Use at least 8 characters.'
    if (values.confirm !== values.password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const result = await registerRequest({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone,
        password: values.password,
      })
      setNotice(result.message || 'Account created successfully! You can now sign in.')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      setNotice(apiErrorMessage(error))
      setErrors(error.response?.data?.errors || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-md w-full mx-auto font-sans">
      {/* Top Segmented Tabs [ Sign In | Create Account ] */}
      <div className="p-1 rounded-2xl bg-slate-100 flex items-center text-xs font-bold">
        <Link
          to="/login"
          className="flex-1 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 text-center transition"
        >
          Sign In
        </Link>
        <button
          type="button"
          className="flex-1 py-2.5 rounded-xl bg-white text-slate-900 shadow-sm transition"
        >
          Create Account
        </button>
      </div>

      {/* Heading & Subtitle */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
          Create your account
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Join thousands of shoppers and certified sellers on ShopVerse.
        </p>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold ${
            notice.includes('successfully')
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
          role="alert"
        >
          {notice}
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={values.name}
              onChange={update}
              placeholder="Sarah Johnson"
              autoComplete="name"
              className={`w-full h-11 pl-10 pr-3 text-xs bg-slate-50 border rounded-xl outline-none transition focus:bg-white focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15 text-slate-900 ${
                errors.name ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={update}
              placeholder="sarah.johnson@example.com"
              autoComplete="email"
              className={`w-full h-11 pl-10 pr-3 text-xs bg-slate-50 border rounded-xl outline-none transition focus:bg-white focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15 text-slate-900 ${
                errors.email ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {errors.email && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
          <div className="relative">
            <input
              type="tel"
              name="phone"
              value={values.phone}
              onChange={update}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
              className={`w-full h-11 pl-10 pr-3 text-xs bg-slate-50 border rounded-xl outline-none transition focus:bg-white focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15 text-slate-900 ${
                errors.phone ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {errors.phone && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.phone}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={visible ? 'text' : 'password'}
              name="password"
              value={values.password}
              onChange={update}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={`w-full h-11 pl-10 pr-10 text-xs bg-slate-50 border rounded-xl outline-none transition focus:bg-white focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15 text-slate-900 ${
                errors.password ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {visible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={visible ? 'text' : 'password'}
              name="confirm"
              value={values.confirm}
              onChange={update}
              placeholder="Re-enter password"
              autoComplete="new-password"
              className={`w-full h-11 pl-10 pr-3 text-xs bg-slate-50 border rounded-xl outline-none transition focus:bg-white focus:border-[#0a2e8c] focus:ring-2 focus:ring-[#0a2e8c]/15 text-slate-900 ${
                errors.confirm ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {errors.confirm && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.confirm}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-2 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{loading ? 'Creating Account…' : 'Create Account'}</span>
          <ArrowRight size={15} />
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-[#0a2e8c] font-bold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  )
}
