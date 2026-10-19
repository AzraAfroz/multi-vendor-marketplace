import api from './api.js'

export async function getProductReviews(productId, params = {}) {
  const { data } = await api.get(`/api/reviews/product/${productId}`, { params })
  return data
}

export async function getMyReviewStatus(productId) {
  const { data } = await api.get(`/api/reviews/product/${productId}/my-status`)
  return data
}

export async function submitProductReview(productId, reviewData) {
  const { data } = await api.post(`/api/reviews/product/${productId}`, reviewData)
  return data
}

export async function toggleReviewHelpful(reviewId) {
  const { data } = await api.post(`/api/reviews/${reviewId}/helpful`)
  return data.review
}

export async function deleteProductReview(reviewId) {
  const { data } = await api.delete(`/api/reviews/${reviewId}`)
  return data
}
