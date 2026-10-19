import api from './api.js'

export async function getRazorpayConfig() {
  const { data } = await api.get('/api/payments/razorpay/config')
  return data
}

export async function createRazorpayOrder(amount) {
  const { data } = await api.post('/api/payments/razorpay/order', { amount })
  return data
}

export async function verifyRazorpayPayment(payload) {
  const { data } = await api.post('/api/payments/razorpay/verify', payload)
  return data
}
