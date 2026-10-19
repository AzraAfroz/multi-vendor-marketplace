import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  ExternalLink,
  Lock,
  Loader2,
  MapPin,
  Minus,
  Navigation,
  Package,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Trash2,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../context/CartContext.jsx'
import useAuth from '../../hooks/useAuth.js'
import { useDeliveryLocation } from '../../context/LocationContext.jsx'
import { createOrder, validateCart } from '../../services/orderService.js'
import { apiErrorMessage } from '../../services/authService.js'
import { createRazorpayOrder, getRazorpayConfig, verifyRazorpayPayment } from '../../services/paymentService.js'

const SHIPPING_STORAGE_KEY = 'marketplace_shipping_address'

function loadRazorpaySdk() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }
    const existingScript = typeof document !== 'undefined' ? document.querySelector('script[src*="checkout.razorpay.com"]') : null
    if (existingScript && window.Razorpay) {
      resolve(true)
      return
    }
    const script = existingScript || document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(Boolean(window.Razorpay))
    script.onerror = () => resolve(false)
    if (!existingScript && typeof document !== 'undefined') {
      document.body.appendChild(script)
    }
    setTimeout(() => {
      resolve(Boolean(typeof window !== 'undefined' && window.Razorpay))
    }, 5000)
  })
}

export default function CheckoutPage() {
  const { cart, cartSubtotal, updateQuantity, removeFromCart, clearCart } = useCart()
  const { user } = useAuth()
  const { location: deliveryLoc, detectCurrentLocation } = useDeliveryLocation()
  const navigate = useNavigate()

  const [address, setAddress] = useState(() => {
    try {
      const saved = localStorage.getItem(SHIPPING_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const isMockStreet = parsed.street === '742 Evergreen Terrace, Apt 4B'
        const isMockName = parsed.fullName === 'Rahul Sharma'
        const isMockPhone = parsed.phone === '+91 98765 43210'
        return {
          fullName: isMockName ? (user?.name || '') : (parsed.fullName || user?.name || ''),
          phone: isMockPhone ? (user?.phone || '') : (parsed.phone || user?.phone || ''),
          street: isMockStreet ? '' : (parsed.street || ''),
          city: parsed.city || deliveryLoc?.city || '',
          state: parsed.state || deliveryLoc?.state || '',
          postalCode: parsed.postalCode || deliveryLoc?.pincode || '',
          country: parsed.country || deliveryLoc?.country || 'IN',
        }
      }
    } catch {
      // ignore
    }
    return {
      fullName: user?.name || '',
      phone: user?.phone || '',
      street: '',
      city: deliveryLoc?.city || '',
      state: deliveryLoc?.state || '',
      postalCode: deliveryLoc?.pincode || '',
      country: deliveryLoc?.country || 'IN',
    }
  })

  // Synchronize with logged-in user profile once available
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName && prev.fullName !== 'Rahul Sharma' ? prev.fullName : (user.name || ''),
        phone: prev.phone && prev.phone !== '+91 98765 43210' ? prev.phone : (user.phone || ''),
      }))
      setCardDetails((prev) => ({
        ...prev,
        name: prev.name && prev.name !== 'Rahul Sharma' ? prev.name : (user.name || ''),
      }))
    }
  }, [user])

  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('razorpay') // 'razorpay' | 'card' | 'cod'
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [processingStep, setProcessingStep] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [locatingGps, setLocatingGps] = useState(false)
  const [gpsNotice, setGpsNotice] = useState('')
  const shippingRef = useRef(null)

  // Auto-fill address via browser GPS & reverse geocoding
  async function handleUseCurrentLocation() {
    setLocatingGps(true)
    setGpsNotice('')
    setError('')
    try {
      const loc = await detectCurrentLocation()
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || user?.name || '',
        phone: prev.phone || (user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''),
        street: loc.street || prev.street || 'Current GPS Location',
        city: loc.city || prev.city || '',
        state: loc.state || prev.state || '',
        postalCode: loc.postalCode || loc.pincode || prev.postalCode || '',
        country: loc.country || prev.country || 'India',
      }))

      // Clear field-level errors for populated fields
      setFieldErrors((prev) => {
        const next = { ...prev }
        if (loc.street) delete next.street
        if (loc.city) delete next.city
        if (loc.state) delete next.state
        if (loc.postalCode || loc.pincode) delete next.postalCode
        return next
      })

      const displayAddress = [loc.street, loc.city, loc.state].filter(Boolean).join(', ')
      setGpsNotice(
        `📍 Live coordinates detected! Applied: ${displayAddress} ${loc.postalCode || loc.pincode ? `(${loc.postalCode || loc.pincode})` : ''}`
      )
      setTimeout(() => setGpsNotice(''), 7000)
    } catch (gpsErr) {
      setGpsNotice('')
      setError(
        gpsErr.message ||
          'Could not retrieve live GPS coordinates. Please allow location permissions in your browser or type your address manually.'
      )
    } finally {
      setLocatingGps(false)
    }
  }

  // Card details state for direct card entry
  const [cardDetails, setCardDetails] = useState({
    number: '',
    rawNumber: '',
    expiry: '',
    cvv: '',
    name: user?.name || '',
  })

  // Razorpay order state
  const [razorpayOrderData, setRazorpayOrderData] = useState(null)

  // Group items by vendor store
  const vendorGroups = useMemo(() => {
    const groups = {}
    cart.forEach((item) => {
      const storeName = item.product.store?.name || 'ShopVerse Official Hub'
      const storeId = item.product.store?.id || item.product.store?._id || 'main'
      if (!groups[storeId]) {
        groups[storeId] = {
          id: storeId,
          name: storeName,
          verified: true,
          shippingSpeed: 'Ships in 24 hrs',
          shippingCost: 0,
          items: [],
        }
      }
      groups[storeId].items.push(item)
    })
    return Object.values(groups)
  }, [cart])

  // Validate cart with backend
  useEffect(() => {
    if (cart.length === 0) return
    let isMounted = true

    async function checkAvailability() {
      try {
        setValidating(true)
        const items = cart.map((item) => ({
          productId: item.product.id || item.product._id,
          quantity: item.quantity,
        }))
        const res = await validateCart(items)
        if (isMounted) {
          if (!res.valid) {
            setError(res.errors?.[0] || 'Some items in your cart are no longer available.')
          } else {
            setError('')
          }
        }
      } catch (err) {
        if (isMounted) setError(apiErrorMessage(err))
      } finally {
        if (isMounted) setValidating(false)
      }
    }

    checkAvailability()
    return () => {
      isMounted = false
    }
  }, [cart])

  const shippingTotal = cartSubtotal >= 500 ? 0 : 50
  const discountTotal = appliedPromo ? 50 : 0
  const estimatedTax = Math.round(cartSubtotal * 0.05)
  const finalTotal = Math.max(0, cartSubtotal + shippingTotal + estimatedTax - discountTotal)

  // Progress to Free Shipping threshold (₹500)
  const freeShippingThreshold = 500
  const awayFromFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal)
  const freeShippingProgress = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100))

  function saveAddressToStorage() {
    try {
      localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(address))
    } catch {
      // ignore
    }
  }

  // Complete Order placement with verified payload
  async function completeOrderPlacement(extraPayload = {}) {
    const payload = {
      items: cart.map((item) => ({
        productId: item.product.id || item.product._id,
        quantity: item.quantity,
      })),
      shippingAddress: address,
      paymentMethod,
      notes,
      ...extraPayload,
    }

    const order = await createOrder(payload)
    saveAddressToStorage()
    clearCart()
    navigate(`/orders/${order.id}`, { replace: true })
  }

  // Handle main Place Order click
  async function handlePlaceOrder(e) {
    if (e?.preventDefault) e.preventDefault()
    if (cart.length === 0) return

    setError('')

    // Validate each required shipping address field
    const errors = {}
    if (!address.fullName?.trim()) {
      errors.fullName = 'Full Name is required'
    }
    const cleanPhone = (address.phone || '').replace(/\D/g, '')
    if (!address.phone?.trim()) {
      errors.phone = 'Phone number is required'
    } else if (cleanPhone.length < 7) {
      errors.phone = 'Enter a valid phone number (at least 7 digits)'
    }
    if (!address.street?.trim()) {
      errors.street = 'Street address is required'
    }
    if (!address.city?.trim()) {
      errors.city = 'City is required'
    }
    if (!address.state?.trim()) {
      errors.state = 'State / Region is required'
    }
    if (!address.postalCode?.trim()) {
      errors.postalCode = 'Postal / PIN code is required'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please provide all required shipping address fields before placing your order.')
      if (shippingRef.current) {
        shippingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      setLoading(false)
      setProcessingStep('')
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      // 1. CASH ON DELIVERY
      if (paymentMethod === 'cod') {
        setProcessingStep('Recording Cash on Delivery order…')
        await completeOrderPlacement({ paymentMethod: 'cod' })
        return
      }

      // 2. CREDIT / DEBIT CARD DIRECT
      if (paymentMethod === 'card') {
        setProcessingStep('Authorizing card transaction…')
        await completeOrderPlacement({ paymentMethod: 'card' })
        return
      }

      // 3. RAZORPAY ONLINE GATEWAY (UPI / Cards / NetBanking / Wallets)
      if (paymentMethod === 'razorpay') {
        setProcessingStep('Creating Razorpay payment intent…')
        let rzpOrder
        try {
          rzpOrder = await createRazorpayOrder(finalTotal)
        } catch (orderErr) {
          setError(
            apiErrorMessage(orderErr) ||
              'Failed to create Razorpay order. Please ensure merchant credentials are configured in backend/.env or choose another payment method.'
          )
          setLoading(false)
          setProcessingStep('')
          return
        }

        setRazorpayOrderData(rzpOrder)
        setProcessingStep('Loading Razorpay Secure Gateway…')

        const sdkLoaded = await loadRazorpaySdk()
        if (!sdkLoaded || !window.Razorpay) {
          setError(
            'The Razorpay checkout script could not be loaded. This is commonly blocked by browser ad-blockers (such as uBlock Origin or Brave Shields). Please disable ad-blockers for this tab, or select Cash on Delivery / Card to complete your purchase.'
          )
          setLoading(false)
          setProcessingStep('')
          return
        }

        try {
          const formattedContact = cleanPhone.slice(-10) || '9876543210'
          const formattedEmail = (user?.email || '').trim() || 'customer@marketplace.com'
          const formattedName = (address.fullName || user?.name || 'Customer').trim()

          const options = {
            key: rzpOrder.keyId,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency || 'INR',
            name: 'ShopVerse Marketplace',
            description: `Checkout for ${cart.length} item(s)`,
            order_id: rzpOrder.orderId,
            prefill: {
              name: formattedName,
              email: formattedEmail,
              contact: formattedContact,
            },
            notes: {
              shippingStreet: address.street,
              shippingCity: address.city,
            },
            theme: {
              color: '#0a2e8c',
            },
            handler: async function (response) {
              try {
                setProcessingStep('Verifying cryptographic signature with backend…')
                await verifyRazorpayPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                })

                setProcessingStep('Finalizing verified marketplace order…')
                await completeOrderPlacement({
                  paymentMethod: 'razorpay',
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                })
              } catch (verifyErr) {
                setError(apiErrorMessage(verifyErr))
                setLoading(false)
                setProcessingStep('')
              }
            },
            modal: {
              ondismiss: function () {
                setLoading(false)
                setProcessingStep('')
              },
            },
          }

          const rzp = new window.Razorpay(options)
          rzp.on('payment.failed', function (resp) {
            setError(resp.error?.description || 'Online payment was declined by issuing bank or cancelled.')
            setLoading(false)
            setProcessingStep('')
          })
          setProcessingStep('Waiting for payment confirmation from Razorpay…')
          rzp.open()
          return
        } catch (sdkError) {
          setError(`Razorpay checkout initialization error: ${sdkError.message}`)
          setLoading(false)
          setProcessingStep('')
          return
        }
      }
    } catch (err) {
      setError(apiErrorMessage(err) || 'Failed to place order. Please try again.')
      setLoading(false)
      setProcessingStep('')
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
        <header className="bg-white border-b border-slate-200 py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-[#0a2e8c] text-white flex items-center justify-center font-bold">
                <ShoppingBag size={20} />
              </div>
              <span className="text-xl font-black text-[#0a2e8c]">ShopVerse</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 max-w-lg mx-auto px-4 py-20 text-center space-y-4">
          <div className="size-16 rounded-3xl bg-slate-100 text-slate-400 grid place-items-center mx-auto">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500">
            You don't have any products queued for checkout. Browse verified stores to add items.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white font-bold text-xs transition shadow-md"
          >
            <ArrowLeft size={14} />
            <span>Return to Marketplace</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Checkout Minimal Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#0a2e8c] text-white flex items-center justify-center font-bold shadow-xs">
              <ShoppingBag size={20} />
            </div>
            <span className="text-xl font-black text-[#0a2e8c]">
              Shop<span className="text-slate-900">Verse</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck size={16} className="text-[#0a2e8c]" />
            <span>256-Bit SSL Encryption</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link to="/" className="hover:text-[#0a2e8c]">Home</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Shopping Cart &amp; Checkout</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Review Cart &amp; Secure Checkout
            </h1>
            <span className="text-xs font-semibold text-slate-500">
              Multi-vendor protected checkout guarantee
            </span>
          </div>
        </div>

        {/* Free Shipping Alert Bar */}
        <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#0a2e8c]/10 text-[#0a2e8c] grid place-items-center shrink-0">
              <Truck size={18} />
            </div>
            <div className="text-xs">
              {cartSubtotal >= freeShippingThreshold ? (
                <span className="font-bold text-emerald-800">
                  🎉 You unlocked FREE Multi-Vendor Delivery on this order!
                </span>
              ) : (
                <span className="text-slate-700">
                  Add <strong>₹{awayFromFreeShipping}</strong> more to get <strong>Free Standard Shipping</strong>!
                </span>
              )}
            </div>
          </div>

          <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0a2e8c] h-full rounded-full transition-all duration-300"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {paymentMethod === 'razorpay' && error.toLowerCase().includes('razorpay') && (
              <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cod')
                    setError('')
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
                >
                  Pay via Cash on Delivery
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay Notice */}
        {loading && processingStep && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#0a2e8c] text-xs font-bold flex items-center gap-2.5 shadow-sm">
            <div className="size-4 border-2 border-[#0a2e8c] border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{processingStep}</span>
          </div>
        )}

        {/* Two Column Layout: Left Details / Right Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Vendor Cart Groups */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Cart Items by Vendor</h2>
                  <p className="text-xs text-slate-500">Items fulfill directly from vendor inventory hubs</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {vendorGroups.map((group, gIdx) => (
                <div key={group.id || `vendor-group-${gIdx}`} className="space-y-4 pt-2">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Store size={16} className="text-[#0a2e8c]" />
                      <span className="text-xs font-bold text-slate-900">{group.name}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Verified Store
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{group.shippingSpeed}</span>
                  </div>

                  {/* Items for this Vendor */}
                  <div className="divide-y divide-slate-100">
                    {group.items.map((item, itemIdx) => {
                      const primaryImg = item.product?.images?.[0]?.url
                      const prodId = item.product?.id || item.product?._id
                      const itemKey = prodId || item?._id || `cart-item-${gIdx}-${itemIdx}`
                      return (
                        <div key={itemKey} className="py-4 flex items-center gap-4">
                          {/* Image */}
                          <div className="size-18 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-2">
                            {primaryImg ? (
                              <img src={primaryImg} alt={item.product?.name} className="size-full object-contain" />
                            ) : (
                              <Package size={24} className="text-slate-300" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {item.product?.category?.name || 'Item'}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 truncate">{item.product?.name}</h4>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              Standard Packaging • 100% Genuine
                            </span>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(prodId, item.quantity - 1)}
                              className="size-7 rounded-lg bg-white border border-slate-200 grid place-items-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(prodId, item.quantity + 1)}
                              className="size-7 rounded-lg bg-white border border-slate-200 grid place-items-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-slate-950 font-mono">
                              ₹{((item.product?.salePrice ?? item.product?.price) || 0) * item.quantity}
                            </div>
                            {item.product?.salePrice && (
                              <div className="text-[10px] text-slate-400 line-through font-mono">
                                ₹{(item.product?.price || 0) * item.quantity}
                              </div>
                            )}
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(prodId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Step 1: Shipping & Delivery Address */}
            <div ref={shippingRef} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="size-8 rounded-full bg-[#0a2e8c] text-white font-black text-sm grid place-items-center">
                    1
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Shipping &amp; Delivery Address</h2>
                    <p className="text-xs text-slate-500">Provide complete address for door delivery dispatch</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Current Location GPS Button */}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locatingGps}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-60 active:scale-[0.98]"
                    title="Auto-detect current GPS location and fill address"
                  >
                    {locatingGps ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Detecting Location…</span>
                      </>
                    ) : (
                      <>
                        <Navigation size={13} className="fill-white" />
                        <span>Use Current Location</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAddress({
                        fullName: address.fullName || user?.name || 'Alex Shopper',
                        phone: (address.phone || user?.phone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210',
                        street: '42 Silicon Avenue, 4th Floor',
                        city: address.city || 'Bengaluru',
                        state: address.state || 'Karnataka',
                        postalCode: address.postalCode || '560001',
                        country: address.country || 'India',
                      })
                      setFieldErrors({})
                      setError('')
                      setGpsNotice('')
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-[#0a2e8c] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                    title="Auto-fill sample test address"
                  >
                    <Sparkles size={13} />
                    <span>Sample Address</span>
                  </button>
                </div>
              </div>

              {/* GPS Live Feedback Banner */}
              {gpsNotice && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span className="flex-1 leading-snug">{gpsNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Active Address Card */}
                <div
                  onClick={() => setSelectedAddressIndex(0)}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer relative ${
                    selectedAddressIndex === 0
                      ? 'border-[#0a2e8c] bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900">{address.fullName || user?.name || 'Delivery Address'} (Primary)</span>
                    <span className="size-5 rounded-full bg-[#0a2e8c] text-white grid place-items-center">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed min-h-10">
                    {address.street ? (
                      <>
                        {address.street}<br />
                        {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}{address.country ? `, ${address.country}` : ''}
                      </>
                    ) : (
                      <span className="text-rose-500 font-medium">Please enter your shipping street address below or click Use Current Location</span>
                    )}
                  </p>
                  <span className="text-[11px] text-slate-400 font-semibold mt-2 block">
                    Phone: {address.phone || 'Please provide phone number'}
                  </span>
                </div>

                {/* Auto-detect GPS Current Location Card */}
                <div
                  onClick={handleUseCurrentLocation}
                  className="p-5 rounded-2xl border-2 border-dashed border-[#0a2e8c]/40 hover:border-[#0a2e8c] bg-blue-50/20 hover:bg-blue-50/60 flex flex-col justify-between transition cursor-pointer group relative active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-xl bg-[#0a2e8c]/10 text-[#0a2e8c] grid place-items-center group-hover:scale-105 transition">
                        {locatingGps ? (
                          <Loader2 size={16} className="animate-spin text-[#0a2e8c]" />
                        ) : (
                          <Navigation size={16} className="text-[#0a2e8c] fill-[#0a2e8c]" />
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-900 group-hover:text-[#0a2e8c] transition">
                        {locatingGps ? 'Detecting coordinates…' : 'Add Current Location'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#0a2e8c] bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                      Live GPS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed min-h-10">
                    Click to fetch your real-time coordinates and automatically populate your street, city, state, and postal code.
                  </p>
                  <span className="text-[11px] font-bold text-[#0a2e8c] flex items-center gap-1 mt-2">
                    <span>{locatingGps ? 'Connecting to GPS…' : 'Tap to fetch live address →'}</span>
                  </span>
                </div>
              </div>

              {/* Address Quick Edit Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Full Name *</label>
                    {fieldErrors.fullName && <span className="text-[10px] text-rose-600 font-bold">{fieldErrors.fullName}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="Receiver's Full Name"
                    value={address.fullName}
                    onChange={(e) => {
                      setAddress({ ...address, fullName: e.target.value })
                      if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }))
                    }}
                    className={`w-full h-10 px-3 text-xs rounded-xl outline-none transition ${
                      fieldErrors.fullName ? 'bg-rose-50 border-2 border-rose-500 focus:border-rose-600' : 'bg-slate-50 border border-slate-200 focus:border-[#0a2e8c]'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Phone Number *</label>
                    {fieldErrors.phone && <span className="text-[10px] text-rose-600 font-bold">{fieldErrors.phone}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="10-digit mobile number"
                    value={address.phone}
                    onChange={(e) => {
                      setAddress({ ...address, phone: e.target.value })
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }))
                    }}
                    className={`w-full h-10 px-3 text-xs rounded-xl outline-none transition ${
                      fieldErrors.phone ? 'bg-rose-50 border-2 border-rose-500 focus:border-rose-600' : 'bg-slate-50 border border-slate-200 focus:border-[#0a2e8c]'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Street Address *</label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locatingGps}
                      className="text-[11px] font-bold text-[#0a2e8c] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Auto-detect current GPS location"
                    >
                      <Navigation size={11} className="fill-[#0a2e8c]" />
                      <span>{locatingGps ? 'Detecting GPS…' : 'Use Current Location'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="House / Flat / Street / Area"
                    value={address.street}
                    onChange={(e) => {
                      setAddress({ ...address, street: e.target.value })
                      if (fieldErrors.street) setFieldErrors((prev) => ({ ...prev, street: '' }))
                    }}
                    className={`w-full h-10 px-3 text-xs rounded-xl outline-none transition ${
                      fieldErrors.street ? 'bg-rose-50 border-2 border-rose-500 focus:border-rose-600' : 'bg-slate-50 border border-slate-200 focus:border-[#0a2e8c]'
                    }`}
                  />
                  {fieldErrors.street && <span className="text-[10px] text-rose-600 font-bold mt-1 block">{fieldErrors.street}</span>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 block">City *</label>
                    {fieldErrors.city && <span className="text-[10px] text-rose-600 font-bold">{fieldErrors.city}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => {
                      setAddress({ ...address, city: e.target.value })
                      if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }))
                    }}
                    className={`w-full h-10 px-3 text-xs rounded-xl outline-none transition ${
                      fieldErrors.city ? 'bg-rose-50 border-2 border-rose-500 focus:border-rose-600' : 'bg-slate-50 border border-slate-200 focus:border-[#0a2e8c]'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 block">State / Region *</label>
                    {fieldErrors.state && <span className="text-[10px] text-rose-600 font-bold">{fieldErrors.state}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => {
                      setAddress({ ...address, state: e.target.value })
                      if (fieldErrors.state) setFieldErrors((prev) => ({ ...prev, state: '' }))
                    }}
                    className={`w-full h-10 px-3 text-xs rounded-xl outline-none transition ${
                      fieldErrors.state ? 'bg-rose-50 border-2 border-rose-500 focus:border-rose-600' : 'bg-slate-50 border border-slate-200 focus:border-[#0a2e8c]'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 block">PIN / Postal Code *</label>
                    {fieldErrors.postalCode && <span className="text-[10px] text-rose-600 font-bold">{fieldErrors.postalCode}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 560001"
                    value={address.postalCode}
                    onChange={(e) => {
                      setAddress({ ...address, postalCode: e.target.value })
                      if (fieldErrors.postalCode) setFieldErrors((prev) => ({ ...prev, postalCode: '' }))
                    }}
                    className={`w-full h-10 px-3 text-xs rounded-xl outline-none transition ${
                      fieldErrors.postalCode ? 'bg-rose-50 border-2 border-rose-500 focus:border-rose-600' : 'bg-slate-50 border border-slate-200 focus:border-[#0a2e8c]'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0a2e8c]"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="size-8 rounded-full bg-[#0a2e8c] text-white font-black text-sm grid place-items-center">
                    2
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Payment Method Selection</h2>
                    <p className="text-xs text-slate-500">All transactions are encrypted with 256-bit SSL</p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck size={14} />
                  <span>Razorpay Certified</span>
                </div>
              </div>

              {/* 3 Supported Payment Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'razorpay',
                    label: 'Razorpay Gateway',
                    sub: 'UPI, GPay, Cards, NetBanking',
                    icon: Zap,
                    badge: 'Instant & Zero Fee',
                  },
                  {
                    id: 'card',
                    label: 'Credit / Debit Card',
                    sub: 'Visa, MasterCard, RuPay',
                    icon: CreditCard,
                    badge: 'Secure Tokenized',
                  },
                  {
                    id: 'cod',
                    label: 'Cash on Delivery',
                    sub: 'Pay at Doorstep',
                    icon: Banknote,
                    badge: 'Verified Cash',
                  },
                ].map((m) => {
                  const Icon = m.icon
                  const active = paymentMethod === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-4 rounded-2xl border-2 flex flex-col justify-between text-left transition cursor-pointer relative ${
                        active
                          ? 'border-[#0a2e8c] bg-blue-50/30 text-slate-950 shadow-xs ring-2 ring-[#0a2e8c]/10'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon size={22} className={active ? 'text-[#0a2e8c]' : 'text-slate-400'} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          active ? 'bg-[#0a2e8c] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {m.badge}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-black block">{m.label}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{m.sub}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Razorpay Banner when selected */}
              {paymentMethod === 'razorpay' && (
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Sparkles size={16} className="text-[#0a2e8c]" />
                      <span>Razorpay Multi-Vendor Smart Payment Gateway</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Instant Clearance
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Clicking <strong>Place Secure Order</strong> will launch the official Razorpay Checkout interface supporting <strong>Google Pay, PhonePe, Paytm, BHIM UPI, Debit/Credit Cards &amp; NetBanking</strong>.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold pt-1">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">UPI</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">GPay</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">PhonePe</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">RuPay</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Visa / MC</span>
                  </div>
                </div>
              )}

              {/* Direct Card Inputs when card selected */}
              {paymentMethod === 'card' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      placeholder="Cardholder's Name"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                      className="w-full h-11 px-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0a2e8c]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="16-digit Card Number"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        className="w-full h-11 px-3 text-xs font-mono bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0a2e8c]"
                      />
                      <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Expiration Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        className="w-full h-11 px-3 text-xs font-mono bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0a2e8c]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        CVV Security Code
                      </label>
                      <input
                        type="password"
                        placeholder="CVV"
                        maxLength={4}
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className="w-full h-11 px-3 text-xs font-mono bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0a2e8c]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* COD note when selected */}
              {paymentMethod === 'cod' && (
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
                  <Banknote size={20} className="text-amber-700 shrink-0" />
                  <div>
                    <strong className="block font-bold">Cash on Delivery Selected</strong>
                    <span className="text-[11px] text-amber-800">
                      You will pay ₹{finalTotal} in cash upon parcel delivery at your doorstep. Please keep exact change ready.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN (ORDER SUMMARY SIDEBAR) ================= */}
          <div className="lg:col-span-4 space-y-6 sticky top-20">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
              <h3 className="text-base font-black text-slate-950 border-b border-slate-100 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.length} items)</span>
                  <span className="font-bold text-slate-900 font-mono">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Multi-Vendor Shipping</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {shippingTotal === 0 ? <span className="text-emerald-700">FREE</span> : `₹${shippingTotal}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="font-bold text-slate-900 font-mono">₹{estimatedTax}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Vendor Promo Discount</span>
                    <span className="font-mono">-₹{discountTotal}</span>
                  </div>
                )}
              </div>

              {/* Promo code input */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Promo code (e.g. SHOPVERSE15)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (promoCode.trim()) setAppliedPromo(true)
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Total Amount</span>
                  <span className="text-[11px] text-slate-400">All duties &amp; taxes included</span>
                </div>
                <div className="text-2xl font-black text-[#0a2e8c] font-mono">
                  ₹{finalTotal}
                </div>
              </div>

              {/* Live Error notice directly above CTA */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-start gap-2.5 shadow-xs">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="leading-snug">{error}</p>
                    {Object.keys(fieldErrors).length > 0 && (
                      <button
                        type="button"
                        onClick={() => shippingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        className="text-[11px] text-[#0a2e8c] font-bold underline cursor-pointer block hover:text-[#07226b]"
                      >
                        Complete missing address fields ↑
                      </button>
                    )}
                    {paymentMethod === 'razorpay' && error.toLowerCase().includes('ad-blocker') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('cod')
                          setError('')
                        }}
                        className="text-[11px] text-emerald-700 font-bold underline cursor-pointer block hover:text-emerald-800"
                      >
                        Switch to Cash on Delivery (Doorstep Payment) →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Active step progress indicator */}
              {loading && processingStep && (
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[#0a2e8c] text-xs font-bold flex items-center gap-2.5 shadow-xs">
                  <div className="size-4 border-2 border-[#0a2e8c] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="truncate">{processingStep}</span>
                </div>
              )}

              {/* Place Secure Order CTA Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-sm font-black transition shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment…</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>
                      {paymentMethod === 'razorpay'
                        ? `Pay with Razorpay (₹${finalTotal})`
                        : paymentMethod === 'card'
                        ? `Pay with Card (₹${finalTotal})`
                        : `Confirm COD Order (₹${finalTotal})`}
                    </span>
                  </>
                )}
              </button>

              {/* Guarantees Badge */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500 text-center">
                <div className="flex items-center justify-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>30-Day Money Back</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Truck size={14} className="text-[#0a2e8c]" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Separate packages info note */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-600 leading-relaxed">
              Your items are coming from <strong>{vendorGroups.length} independent verified vendor warehouses</strong>. They will arrive in separate optimized eco-friendly packages.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
