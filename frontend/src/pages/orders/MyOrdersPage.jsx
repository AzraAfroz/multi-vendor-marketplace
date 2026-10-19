import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronRight,
  Package,
  ShoppingBag,
} from 'lucide-react'
import Pagination from '../../components/common/Pagination.jsx'
import { getMyOrders } from '../../services/orderService.js'
import { apiErrorMessage } from '../../services/authService.js'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadOrders(pageToLoad = pagination.page) {
    setLoading(true)
    setError('')

    getMyOrders({ page: pageToLoad, limit: pagination.limit || 10 })
      .then((data) => {
        setOrders(data?.items || [])
        if (data?.pagination) {
          setPagination(data.pagination)
        }
      })
      .catch((err) => {
        setError(apiErrorMessage(err))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadOrders(1)
  }, [])

  const statusColors = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    processing: 'bg-blue-50 text-blue-800 border-blue-200',
    shipped: 'bg-purple-50 text-purple-800 border-purple-200',
    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
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
            <Link to="/account" className="text-slate-600 hover:text-[#0a2e8c] transition">
              My Account
            </Link>
            <Link to="/" className="text-[#0a2e8c] font-bold hover:underline">
              Shop Marketplace &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-950">My Order History</h1>
          <p className="text-xs text-slate-500 mt-1">Track and manage your multi-vendor marketplace purchases.</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="size-10 border-3 border-[#0a2e8c] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading your orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs max-w-md mx-auto space-y-4">
            <div className="size-16 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mx-auto">
              <Package size={32} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">No orders placed yet</h2>
              <p className="text-xs text-slate-500 mt-1">
                You haven't placed any orders on the marketplace yet. Explore our approved vendor stores!
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0a2e8c] hover:bg-[#07226b] text-white text-xs font-bold transition shadow-xs"
            >
              Start Shopping <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block font-mono">
                        Order #{order.orderNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> Placed {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          statusColors[order.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {order.status}
                      </span>
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-xs font-bold text-[#0a2e8c] hover:underline inline-flex items-center gap-1"
                      >
                        View Order <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-x-auto pb-1">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="relative shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className="size-14 rounded-xl object-contain bg-slate-50 border border-slate-200"
                            />
                          ) : (
                            <div className="size-14 rounded-xl bg-slate-100 grid place-items-center text-slate-400">
                              <Package size={18} />
                            </div>
                          )}
                          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-slate-800 text-white font-bold text-[9px] grid place-items-center">
                            {item.quantity}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <span className="text-xs text-slate-500 font-bold self-center">
                          +{order.items.length - 4} more
                        </span>
                      )}
                    </div>

                    <div className="text-right sm:text-right shrink-0">
                      <span className="text-[11px] text-slate-500 block">Total Amount</span>
                      <span className="text-base font-black text-slate-950 font-mono">
                        ₹{Number(order.totalPrice).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
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
      </main>
    </div>
  )
}
