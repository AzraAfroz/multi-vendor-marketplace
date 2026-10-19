import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Package,
  Phone,
  Store,
  Truck,
} from 'lucide-react'
import Pagination from '../../components/common/Pagination.jsx'
import { getVendorOrders, updateVendorOrderStatus } from '../../services/orderService.js'
import { getMyVendorStore } from '../../services/vendorService.js'
import { apiErrorMessage } from '../../services/authService.js'

export default function VendorOrdersPage() {
  const [vendor, setVendor] = useState(null)
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  async function loadOrders(pageToLoad = pagination.page) {
    setLoading(true)
    setError('')
    try {
      const v = vendor || (await getMyVendorStore())
      if (!vendor) setVendor(v)
      if (v?.status === 'approved') {
        const data = await getVendorOrders({ page: pageToLoad, limit: pagination.limit || 10 })
        setOrders(data?.items || [])
        if (data?.pagination) {
          setPagination(data.pagination)
        }
      }
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(1)
  }, [])

  async function handleStatusChange(orderId, newStatus) {
    setUpdatingId(orderId)
    setError('')
    setSuccessNotice('')

    try {
      const updated = await updateVendorOrderStatus(orderId, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status, items: updated.items } : o))
      )
      setSuccessNotice(`Order status updated to ${newStatus}.`)
      setTimeout(() => setSuccessNotice(''), 3000)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setUpdatingId('')
    }
  }

  const statusColors = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    processing: 'bg-blue-50 text-blue-800 border-blue-200',
    shipped: 'bg-purple-50 text-purple-800 border-purple-200',
    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-10 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <span className="size-9 rounded-xl bg-[#0a2e8c] text-white grid place-items-center shadow-xs">
              <Store size={18} />
            </span>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-950">
              {vendor?.storeName || 'Vendor Portal'}
            </span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/vendor/products" className="text-slate-600 hover:text-[#0a2e8c] transition">
              Products &amp; Stock
            </Link>
            <Link to="/vendor/store" className="text-slate-600 hover:text-[#0a2e8c] transition">
              Store Profile
            </Link>
            <Link to="/account" className="text-[#0a2e8c] font-bold hover:underline">
              Account Overview &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <Link to="/account" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#0a2e8c] mb-1">
              <ArrowLeft size={13} /> Back to account
            </Link>
            <h1 className="text-2xl font-black text-slate-950">Store Orders &amp; Fulfillment</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Fulfill customer purchases for products sold under <strong>{vendor?.storeName}</strong>.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 self-start sm:self-auto">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Assigned
          </span>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700" />
            <span>{successNotice}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="size-10 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-gray-600">Loading store orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-2xs max-w-md mx-auto space-y-3">
            <div className="size-16 rounded-2xl bg-gray-100 text-gray-400 grid place-items-center mx-auto">
              <Package size={32} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No customer orders yet</h3>
            <p className="text-xs text-gray-500">
              When shoppers purchase your store's products, their orders will appear here for fulfillment.
            </p>
            <Link
              to="/vendor/products"
              className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition"
            >
              Manage Catalog Products &rarr;
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {orders.map((order) => {
                const vendorItems = order.vendorItems || order.items || []
                return (
                  <article
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900">
                            Order {order.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              statusColors[order.status] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} /> Placed {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Quick fulfillment selector */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-600">Update Status:</label>
                        <select
                          disabled={updatingId === order.id}
                          defaultValue={vendorItems[0]?.vendorStatus || order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 outline-none focus:border-emerald-700 cursor-pointer disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer Delivery Info & Store Subtotal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/75 rounded-xl p-4 border border-gray-200/60 text-xs">
                      <div>
                        <span className="font-bold text-gray-700 block mb-1 flex items-center gap-1">
                          <Truck size={13} className="text-emerald-700" /> Ship To:
                        </span>
                        <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
                        <p className="text-gray-600">
                          {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                        <p className="text-gray-500 flex items-center gap-1 mt-1">
                          <Phone size={11} /> {order.shippingAddress.phone}
                        </p>
                      </div>

                      <div className="md:text-right">
                        <span className="text-slate-500 block">Your Store Payout for Order</span>
                        <span className="text-lg font-black text-emerald-900 block mt-0.5 font-mono">
                          ₹{Number(order.vendorSubtotal || order.itemsPrice).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Payment: <strong className="uppercase">{order.paymentMethod}</strong> ({order.paymentStatus})
                        </span>
                      </div>
                    </div>

                    {/* Purchased items belonging to this vendor */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Store Line Items ({vendorItems.length})
                      </h4>
                      <div className="divide-y divide-slate-100 text-xs">
                        {vendorItems.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt=""
                                  className="size-12 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="size-12 rounded-lg bg-slate-100 grid place-items-center text-slate-400 shrink-0">
                                  <Package size={16} />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <span className="text-slate-500 text-[11px] font-mono">
                                  Qty: {item.quantity} &times; ₹{Number(item.price).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            <span className="font-bold text-slate-950 font-mono">
                              ₹{Number(item.subtotal).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {!loading && orders.length > 0 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(nextPage) => loadOrders(nextPage)}
                className="mt-6"
              />
            )}
          </>
        )}
      </div>
    </main>
  )
}
