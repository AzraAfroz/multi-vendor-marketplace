const reviewService = require('../services/reviewService')

async function createReview(req, res, next) {
  try {
    const review = await reviewService.createOrUpdateReview(req.params.productId, req.user, req.body)
    return res.status(201).json({ message: 'Review submitted successfully.', review })
  } catch (error) {
    return next(error)
  }
}

async function getProductReviews(req, res, next) {
  try {
    const currentUserId = req.user?._id || null
    const result = await reviewService.getProductReviews(req.params.productId, req.query, currentUserId)
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

async function getUserReviewStatus(req, res, next) {
  try {
    const result = await reviewService.getUserReviewStatus(req.params.productId, req.user._id)
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

async function toggleHelpful(req, res, next) {
  try {
    const review = await reviewService.toggleHelpful(req.params.id, req.user._id)
    return res.json({ review })
  } catch (error) {
    return next(error)
  }
}

async function deleteReview(req, res, next) {
  try {
    const result = await reviewService.deleteReview(req.params.id, req.user)
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createReview,
  getProductReviews,
  getUserReviewStatus,
  toggleHelpful,
  deleteReview,
}
