import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Package,
  Phone,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { getOrderById, cancelOrder } from '../../services/orderService.js'
import { apiErrorMessage } from '../../services/authService.js'

export default function OrderDetailsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelNotice, setCancelNotice] = useState('')

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')

    getOrderById(id)
      .then((data) => {
        if (isMounted) setOrder(data)
      })
      .catch((err) => {
        if (isMounted) setError(apiErrorMessage(err))
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  async function handleConfirmCancel(e) {
    e.preventDefault()
    if (!order) return
    setCancelling(true)
    setCancelError('')

    try {
      const updated = await cancelOrder(order.id, cancelReason)
      setOrder(updated)
      setShowCancelModal(false)
      setCancelNotice('Your order has been cancelled and product stock has been restored.')
      setCancelReason('')
    } catch (err) {
      setCancelError(apiErrorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="size-10 border-3 border-[#0a2e8c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Retrieving order details…</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs">
          <div className="size-14 rounded-full bg-rose-50 text-rose-600 grid place-items-center mx-auto mb-3">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Order Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Unable to locate this order.'}</p>
          <Link
            to="/orders"
            className="px-5 py-2.5 bg-[#0a2e8c] hover:bg-[#07226b] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            View My Orders
          </Link>
        </div>
      </div>
    )
  }

  const statusColors = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    processing: 'bg-blue-50 text-blue-800 border-blue-200',
    shipped: 'bg-purple-50 text-purple-800 border-purple-200',
    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
  }

  const canCancel = ['pending', 'processing'].includes(order.status)

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-10 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <span className="size-9 rounded-xl bg-[#0a2e8c] text-white grid place-items-center shadow-xs">
              <ShoppingBag size={18} />
            </span>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-950">
              Shop<span className="text-[#0a2e8c]">Verse</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/orders" className="text-slate-600 hover:text-[#0a2e8c] transition">
              My Orders
            </Link>
            <Link to="/" className="text-[#0a2e8c] font-bold hover:underline">
              Shop Marketplace &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {cancelNotice && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-amber-700 shrink-0" />
            <span>{cancelNotice}</span>
          </div>
        )}

        {/* Cancellation Notice Banner */}
        {order.status === 'cancelled' && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <XCircle size={16} />
              <span>This order has been cancelled</span>
            </div>
            <p className="text-rose-800">
              {order.cancelReason ? `Reason: "${order.cancelReason}"` : 'Cancelled before dispatch.'}{' '}
              {order.cancelledAt && (
                <span className="text-rose-600">
                  (on {new Date(order.cancelledAt).toLocaleString()})
                </span>
              )}
            </p>
            <p className="text-[11px] text-rose-600">
              Product items and reserved quantities have been returned to inventory.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/orders" className="text-xs text-gray-500 hover:text-emerald-800 flex items-center gap-1 font-medium">
                <ArrowLeft size={13} /> All Orders
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-950 flex items-center gap-2">
              Order {order.orderNumber}
            </h1>
            <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Calendar size={13} /> Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Status & Cancel Action */}
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                statusColors[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'
              }`}
            >
              Order {order.status}
            </span>

            {canCancel && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-3 py-1 rounded-lg text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={13} /> Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-100 pb-2">
              <Truck size={15} className="text-emerald-700" />
              <span>Delivery Address</span>
            </div>
            <p className="font-bold text-gray-950">{order.shippingAddress.fullName}</p>
            <p className="text-gray-600 leading-relaxed">
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </p>
            <p className="text-gray-500 flex items-center gap-1 pt-1">
              <Phone size={11} /> {order.shippingAddress.phone}
            </p>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
              <CreditCard size={15} className="text-[#0a2e8c]" />
              <span>Payment Details</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Method</span>
              <span className="font-bold uppercase text-slate-900">{order.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
            {order.razorpayPaymentId && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Payment ID</span>
                <span className="font-mono font-bold text-slate-800 text-[11px]">{order.razorpayPaymentId}</span>
              </div>
            )}
            {order.paidAt && (
              <p className="text-[11px] text-slate-400 pt-1">
                Settled on {new Date(order.paidAt).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>

          {/* Order Summary & Pricing */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
              <CreditCard size={15} className="text-[#0a2e8c]" />
              <span>Financial Summary</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Items Total</span>
              <span className="font-bold text-slate-900 font-mono">₹{Number(order.itemsPrice).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="font-bold text-slate-900 font-mono">
                {order.shippingPrice === 0 ? <span className="text-emerald-700">Free</span> : `₹${Number(order.shippingPrice).toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-slate-100">
              <span>Total Paid/Due</span>
              <span className="text-[#0a2e8c] font-mono">₹{Number(order.totalPrice).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Purchased Products ({order.items.length})
            </h2>
            <span className="text-[11px] text-slate-400">Multi-Vendor Itemized Fulfillment</span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="size-16 rounded-xl object-contain bg-slate-50 border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="size-16 rounded-xl bg-slate-100 grid place-items-center text-slate-400 shrink-0">
                      <Package size={22} />
                    </div>
                  )}
                  <div>
                    <Link
                      to={`/products/${item.productId}`}
                      className="text-sm font-bold text-slate-900 hover:text-[#0a2e8c] transition line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      {item.vendor && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0a2e8c]">
                          <Store size={12} /> {item.vendor.name}
                        </span>
                      )}
                      <span>Qty: {item.quantity}</span>
                      <span className="font-mono">Unit: ₹{Number(item.price).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                  <span className="text-sm font-black text-slate-950 font-mono">
                    ₹{Number(item.subtotal).toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      statusColors[item.vendorStatus] || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Vendor: {item.vendorStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Timeline (Section 12 requirement) */}
        {order.timeline && order.timeline.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Clock size={16} className="text-emerald-800" />
              <span>Order Timeline &amp; Status Activity</span>
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {order.timeline.map((event, index) => (
                <div key={index} className="relative text-xs">
                  <span className={`absolute -left-6 top-0.5 size-4 rounded-full border-2 border-white grid place-items-center ${
                    event.status === 'cancelled'
                      ? 'bg-rose-600'
                      : event.status === 'delivered'
                      ? 'bg-emerald-600'
                      : 'bg-emerald-800'
                  }`} />
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-bold text-gray-900 uppercase tracking-wide">
                      {event.status}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {event.note && (
                    <p className="text-gray-600 mt-0.5">{event.note}</p>
                  )}
                  <span className="text-[10px] text-gray-400 capitalize">
                    Updated by {event.updatedBy || 'system'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-4">
          <Link
            to="/orders"
            className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back to My Orders
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-xs"
          >
            Continue Shopping
          </Link>
        </div>
      </main>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => !cancelling && setShowCancelModal(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                  <RotateCcw size={20} />
                  <h3>Cancel Order</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-gray-600">
                Are you sure you want to cancel order <strong className="text-gray-900">{order.orderNumber}</strong>?
                Reserved inventory will be returned to the sellers.
              </p>

              {cancelError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {cancelError}
                </div>
              )}

              <form onSubmit={handleConfirmCancel} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Reason for Cancellation (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Ordered by mistake, found another product..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-emerald-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                  >
                    Keep Order
                  </button>
                  <button
                    type="submit"
                    disabled={cancelling}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
