const mongoose = require('mongoose')
const Review = require('../models/Review')
const Product = require('../models/Product')
const Order = require('../models/Order')
const HttpError = require('../utils/HttpError')

async function recalculateProductRating(productId) {
  const prodId = new mongoose.Types.ObjectId(productId)
  const stats = await Review.aggregate([
    { $match: { product: prodId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ])

  if (stats.length > 0) {
    const avg = Math.round(stats[0].avgRating * 10) / 10
    await Product.findByIdAndUpdate(prodId, { rating: avg, numReviews: stats[0].numReviews })
  } else {
    await Product.findByIdAndUpdate(prodId, { rating: 0, numReviews: 0 })
  }
}

async function checkVerifiedBuyer(userId, productId) {
  if (!userId || !productId) return false
  const match = await Order.exists({
    customer: userId,
    'items.product': productId,
    $or: [{ paymentStatus: 'paid' }, { status: 'delivered' }, { status: 'processing' }, { status: 'shipped' }],
  })
  return Boolean(match)
}

function presentReview(review, currentUserId = null) {
  const isHelpfulByMe = currentUserId
    ? (review.helpfulUsers || []).some((uid) => String(uid) === String(currentUserId))
    : false

  return {
    id: String(review._id),
    productId: String(review.product),
    user: review.user
      ? {
          id: String(review.user._id || review.user),
          name: review.user.name || 'Anonymous Shopper',
          avatar: review.user.avatar || null,
        }
      : { id: 'unknown', name: 'Shopper' },
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
    helpfulCount: review.helpfulCount || 0,
    isHelpfulByMe,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }
}

async function createOrUpdateReview(productId, user, { rating, title, comment }) {
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw new HttpError(400, 'A valid product ID is required.')
  }

  const numRating = Number(rating)
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    throw new HttpError(400, 'Rating must be an integer between 1 and 5 stars.')
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new HttpError(400, 'Review title is required.')
  }
  const cleanTitle = title.trim()
  if (cleanTitle.length < 2 || cleanTitle.length > 120) {
    throw new HttpError(400, 'Review title must be between 2 and 120 characters.')
  }

  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    throw new HttpError(400, 'Review comment is required.')
  }
  const cleanComment = comment.trim()
  if (cleanComment.length < 5 || cleanComment.length > 3000) {
    throw new HttpError(400, 'Review comment must be between 5 and 3000 characters.')
  }

  const product = await Product.findById(productId)
  if (!product || product.status === 'archived') {
    throw new HttpError(404, 'Product was not found or is no longer available.')
  }

  const isVerifiedPurchase = await checkVerifiedBuyer(user._id, productId)

  const review = await Review.findOneAndUpdate(
    { product: productId, user: user._id },
    {
      $set: {
        rating: numRating,
        title: cleanTitle,
        comment: cleanComment,
        isVerifiedPurchase,
      },
    },
    { upsert: true, returnDocument: 'after', runValidators: true }
  ).populate('user', 'name avatar')

  await recalculateProductRating(productId)

  return presentReview(review, user._id)
}

async function getProductReviews(productId, query = {}, currentUserId = null) {
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw new HttpError(400, 'A valid product ID is required.')
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10))
  const skip = (page - 1) * limit
  const sort = query.sort || 'newest'

  const sortOptions = {
    newest: { createdAt: -1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 },
    helpful: { helpfulCount: -1, createdAt: -1 },
  }
  const sortOrder = sortOptions[sort] || sortOptions.newest

  const filter = { product: productId }
  if (query.rating && [1, 2, 3, 4, 5].includes(Number(query.rating))) {
    filter.rating = Number(query.rating)
  }
  if (query.verified === 'true') {
    filter.isVerifiedPurchase = true
  }

  const [reviews, totalCount, distributionData] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ])

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let totalAllReviews = 0
  let totalRatingSum = 0

  distributionData.forEach((item) => {
    if (ratingCounts[item._id] !== undefined) {
      ratingCounts[item._id] = item.count
      totalAllReviews += item.count
      totalRatingSum += item._id * item.count
    }
  })

  const averageRating = totalAllReviews > 0 ? Math.round((totalRatingSum / totalAllReviews) * 10) / 10 : 0

  const ratingPercentages = {
    5: totalAllReviews ? Math.round((ratingCounts[5] / totalAllReviews) * 100) : 0,
    4: totalAllReviews ? Math.round((ratingCounts[4] / totalAllReviews) * 100) : 0,
    3: totalAllReviews ? Math.round((ratingCounts[3] / totalAllReviews) * 100) : 0,
    2: totalAllReviews ? Math.round((ratingCounts[2] / totalAllReviews) * 100) : 0,
    1: totalAllReviews ? Math.round((ratingCounts[1] / totalAllReviews) * 100) : 0,
  }

  return {
    items: reviews.map((r) => presentReview(r, currentUserId)),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    summary: {
      averageRating,
      totalReviews: totalAllReviews,
      ratingCounts,
      ratingPercentages,
    },
  }
}

async function getUserReviewStatus(productId, userId) {
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw new HttpError(400, 'A valid product ID is required.')
  }

  const [existingReview, isVerifiedBuyer] = await Promise.all([
    userId ? Review.findOne({ product: productId, user: userId }).lean() : null,
    userId ? checkVerifiedBuyer(userId, productId) : false,
  ])

  return {
    hasReviewed: Boolean(existingReview),
    userReview: existingReview ? presentReview(existingReview, userId) : null,
    isVerifiedBuyer,
  }
}

async function toggleHelpful(reviewId, userId) {
  if (!reviewId || !mongoose.isValidObjectId(reviewId)) {
    throw new HttpError(400, 'A valid review ID is required.')
  }
  if (!userId) {
    throw new HttpError(401, 'You must be signed in to mark a review as helpful.')
  }

  const review = await Review.findById(reviewId)
  if (!review) {
    throw new HttpError(404, 'Review was not found.')
  }

  const alreadyHelpful = review.helpfulUsers.some((id) => String(id) === String(userId))
  if (alreadyHelpful) {
    review.helpfulUsers = review.helpfulUsers.filter((id) => String(id) !== String(userId))
    review.helpfulCount = Math.max(0, review.helpfulCount - 1)
  } else {
    review.helpfulUsers.push(userId)
    review.helpfulCount += 1
  }

  await review.save()
  const populated = await Review.findById(reviewId).populate('user', 'name avatar').lean()
  return presentReview(populated, userId)
}

async function deleteReview(reviewId, user) {
  if (!reviewId || !mongoose.isValidObjectId(reviewId)) {
    throw new HttpError(400, 'A valid review ID is required.')
  }

  const review = await Review.findById(reviewId)
  if (!review) {
    throw new HttpError(404, 'Review was not found.')
  }

  if (String(review.user) !== String(user._id) && user.role !== 'admin') {
    throw new HttpError(403, 'You do not have permission to delete this review.')
  }

  const productId = review.product
  await Review.findByIdAndDelete(reviewId)
  await recalculateProductRating(productId)

  return { success: true, message: 'Review deleted successfully.' }
}

module.exports = {
  createOrUpdateReview,
  getProductReviews,
  getUserReviewStatus,
  toggleHelpful,
  deleteReview,
}
