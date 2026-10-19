import api from './api.js'

function ensureConfigured() {
  if (!api.defaults.baseURL) throw new Error('Set VITE_API_BASE_URL in frontend/.env before using authentication.')
}

export async function loginRequest(payload) {
  ensureConfigured()
  const { data } = await api.post('/api/auth/login', payload)
  return data
}

export async function googleAuthRequest(payload) {
  ensureConfigured()
  const { data } = await api.post('/api/auth/google', payload)
  return data
}

export async function registerRequest(payload) {
  ensureConfigured()
  const { data } = await api.post('/api/auth/register', payload)
  return data
}

export async function forgotPasswordRequest(payload) {
  ensureConfigured()
  const { data } = await api.post('/api/auth/forgot-password', payload)
  return data
}

export async function resetPasswordRequest(payload) {
  ensureConfigured()
  const { data } = await api.post('/api/auth/reset-password', payload)
  return data
}

export async function currentUserRequest() {
  ensureConfigured()
  const { data } = await api.get('/api/auth/me')
  return data.user
}

export async function logoutRequest() {
  ensureConfigured()
  const { data } = await api.post('/api/auth/logout')
  return data
}

export function apiErrorMessage(error) {
  return error.response?.data?.message || (error.code === 'ERR_NETWORK'
    ? 'Could not reach the server. Check that the API is running and VITE_API_BASE_URL is correct.'
    : error.message || 'Something went wrong. Please try again.')
}
