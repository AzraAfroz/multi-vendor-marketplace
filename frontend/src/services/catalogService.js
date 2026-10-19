import api from './api.js'

// Public Catalog
export async function getPublicCategories(params = {}) {
  const { data } = await api.get('/api/public/categories', { params })
  return data.categories
}

export async function getPublicBrands(params = {}) {
  const { data } = await api.get('/api/public/brands', { params })
  return data.brands
}

export async function getPublicStores(params = {}) {
  const { data } = await api.get('/api/public/stores', { params })
  return data.stores
}

export async function getPublicStore(id) {
  const { data } = await api.get(`/api/public/stores/${id}`)
  return data.store
}

export async function getPublicProducts(params = {}) {
  const { data } = await api.get('/api/public/products', { params })
  return data.products
}

export async function getPublicProductById(id) {
  const { data } = await api.get(`/api/public/products/${id}`)
  return data.product
}

// Admin Categories
export async function getAdminCategories() {
  const { data } = await api.get('/api/admin/categories')
  return data.categories
}

export async function createAdminCategory(payload) {
  const { data } = await api.post('/api/admin/categories', payload)
  return data
}

export async function updateAdminCategory(id, payload) {
  const { data } = await api.patch(`/api/admin/categories/${id}`, payload)
  return data
}

export async function deleteAdminCategory(id) {
  const { data } = await api.delete(`/api/admin/categories/${id}`)
  return data
}

// Admin Brands
export async function getAdminBrands() {
  const { data } = await api.get('/api/admin/brands')
  return data.brands
}

export async function createAdminBrand(payload) {
  const { data } = await api.post('/api/admin/brands', payload)
  return data
}

export async function updateAdminBrand(id, payload) {
  const { data } = await api.patch(`/api/admin/brands/${id}`, payload)
  return data
}

export async function deleteAdminBrand(id) {
  const { data } = await api.delete(`/api/admin/brands/${id}`)
  return data
}
