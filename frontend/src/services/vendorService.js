import api from './api.js'

export async function getMyVendorProfile() {
  const { data } = await api.get('/api/vendor/me')
  return data.vendor
}

export async function getMyVendorStore() {
  const { data } = await api.get('/api/vendor/store')
  return data.vendor
}

export async function createVendorProfile(payload) {
  const { data } = await api.post('/api/vendor/onboarding', payload)
  return data
}

export async function submitVendorKyc(file) {
  const formData = new FormData()
  formData.append('document', file)
  const { data } = await api.post('/api/vendor/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data
}

export async function getPendingVendorApplications() {
  const { data } = await api.get('/api/admin/vendors', { params: { status: 'pending' } })
  return data.vendors
}

export async function getVendorKycDocument(vendorId) {
  const { data } = await api.get(`/api/admin/vendors/${vendorId}/kyc`, { responseType: 'blob' })
  return data
}

export async function reviewVendorApplication(vendorId, decision) {
  const { data } = await api.patch(`/api/admin/vendors/${vendorId}/review`, { decision })
  return data
}
