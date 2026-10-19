const express = require('express')
const authenticate = require('../middleware/authenticate')
const paymentController = require('../controllers/paymentController')

const router = express.Router()

router.get('/razorpay/config', paymentController.getConfig)
router.post('/razorpay/order', authenticate, paymentController.createRazorpayOrder)
router.post('/razorpay/verify', authenticate, paymentController.verifyRazorpayPayment)

module.exports = router
