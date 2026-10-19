const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const authenticate = require('../middleware/authenticate')
const controller = require('../controllers/reviewController')

const router = express.Router()

// Optional authentication middleware for public review listing
async function optionalAuthenticate(req, res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
      const user = await User.findById(payload.sub).select('name email phone role')
      if (user) req.user = user
    } catch {
      // Ignore token failure for public listing
    }
  }
  next()
}

// Public endpoints
router.get('/product/:productId', optionalAuthenticate, controller.getProductReviews)

// Authenticated endpoints
router.get('/product/:productId/my-status', authenticate, controller.getUserReviewStatus)
router.post('/product/:productId', authenticate, controller.createReview)
router.post('/:id/helpful', authenticate, controller.toggleHelpful)
router.delete('/:id', authenticate, controller.deleteReview)

module.exports = router
