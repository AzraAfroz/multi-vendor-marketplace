import api from './api.js'

export async function getVendorProducts(params = {}) {
  const { data } = await api.get('/api/vendor/products', { params })
  return data
}

export async function getVendorProductById(id) {
  const { data } = await api.get(`/api/vendor/products/${id}`)
  return data.product
}

export async function createVendorProduct(payload) {
  const { data } = await api.post('/api/vendor/products', payload)
  return data
}

export async function updateVendorProduct(id, payload) {
  const { data } = await api.patch(`/api/vendor/products/${id}`, payload)
  return data
}

export async function deleteVendorProduct(id) {
  const { data } = await api.delete(`/api/vendor/products/${id}`)
  return data
}

export async function uploadVendorProductImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await api.post('/api/vendor/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
