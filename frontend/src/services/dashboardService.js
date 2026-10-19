import api from './api.js'

export async function getAdminDashboardMetrics(range = '30d') {
  const { data } = await api.get(`/api/admin/dashboard/metrics?range=${range}`)
  return data
}

export async function getVendorDashboardMetrics(range = '30d') {
  const { data } = await api.get(`/api/vendor/dashboard/metrics?range=${range}`)
  return data
}

export async function updateVendorStockQuick(productId, stock) {
  const { data } = await api.patch(`/api/vendor/dashboard/products/${productId}/stock`, { stock })
  return data
}

export async function getCustomerDashboard() {
  const { data } = await api.get('/api/customer/dashboard')
  return data
}
