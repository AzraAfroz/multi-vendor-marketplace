import api from './api.js'

// Customer Orders
export async function validateCart(items) {
  const { data } = await api.post('/api/orders/validate-cart', { items })
  return data
}

export async function createOrder(payload) {
  const { data } = await api.post('/api/orders', payload)
  return data.order
}

export async function getMyOrders(params = {}) {
  const { data } = await api.get('/api/orders/my-orders', { params })
  return data.orders
}

export async function getOrderById(id) {
  const { data } = await api.get(`/api/orders/${id}`)
  return data.order
}

export async function cancelOrder(id, reason = '') {
  const { data } = await api.patch(`/api/orders/${id}/cancel`, { reason })
  return data.order
}

// Vendor Orders
export async function getVendorOrders(params = {}) {
  const { data } = await api.get('/api/vendor/orders', { params })
  return data.orders
}

export async function updateVendorOrderStatus(orderId, status) {
  const { data } = await api.patch(`/api/vendor/orders/${orderId}/status`, { status })
  return data.order
}

// Admin Orders
export async function getAdminOrders(params = {}) {
  const { data } = await api.get('/api/admin/orders', { params })
  return data.orders
}

export async function updateAdminOrderStatus(orderId, payload) {
  const { data } = await api.patch(`/api/admin/orders/${orderId}/status`, payload)
  return data.order
}
