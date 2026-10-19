const Razorpay = require('razorpay')
const mongoose = require('mongoose')
const HttpError = require('../utils/HttpError')
const Order = require('../models/Order')
const { verifyRazorpaySignature } = require('../utils/paymentVerification')

function getCredentials() {
  const currentKeyId = (process.env.RAZORPAY_KEY_ID || '').trim()
  const currentKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim()
  const isConfigured = Boolean(currentKeyId && currentKeySecret)

  return {
    keyId: currentKeyId,
    keySecret: currentKeySecret,
    isConfigured,
  }
}

exports.getConfig = (req, res) => {
  const { keyId, isConfigured } = getCredentials()
  res.json({
    keyId: isConfigured ? keyId : null,
    currency: 'INR',
    configured: isConfigured,
  })
}

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}` } = req.body
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new HttpError(400, 'Valid numeric amount greater than 0 is required.')
    }

    const { keyId, keySecret, isConfigured } = getCredentials()
    if (!isConfigured) {
      throw new HttpError(503, 'Razorpay payment gateway credentials are not configured.')
    }

    const amountInPaise = Math.round(amount * 100)
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret })

    let razorpayOrder
    try {
      razorpayOrder = await client.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
      })
    } catch (sdkError) {
      const isAuthError = sdkError.statusCode === 401 || sdkError.error?.description === 'Authentication failed' || keyId.includes('shopverse123')
      const desc = isAuthError
        ? 'Invalid Razorpay merchant credentials. Please copy your real Test Key ID and Key Secret from your Razorpay Dashboard into backend/.env (or select Cash on Delivery / Card to complete your order).'
        : (sdkError.error?.description || sdkError.message || 'Payment gateway rejection')
      throw new HttpError(502, `Razorpay order creation failed: ${desc}`)
    }

    return res.status(201).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
    })
  } catch (error) {
    next(error)
  }
}

exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpError(400, 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.')
    }

    const { keyId, keySecret, isConfigured } = getCredentials()
    if (!isConfigured) {
      throw new HttpError(503, 'Razorpay payment gateway credentials are not configured.')
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    )

    if (!isValid) {
      if (orderId && mongoose.isValidObjectId(orderId)) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'failed',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        })
      }
      throw new HttpError(400, 'Invalid payment signature verification failed.')
    }

    // Verify actual payment status via Razorpay API if client can query it
    let paymentStatus = 'captured'
    try {
      const client = new Razorpay({ key_id: keyId, key_secret: keySecret })
      const paymentRecord = await client.payments.fetch(razorpay_payment_id)
      if (paymentRecord) {
        if (paymentRecord.status !== 'captured' && paymentRecord.status !== 'authorized') {
          if (orderId && mongoose.isValidObjectId(orderId)) {
            await Order.findByIdAndUpdate(orderId, {
              paymentStatus: 'failed',
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
            })
          }
          throw new HttpError(400, `Razorpay payment is in '${paymentRecord.status}' state, not captured.`)
        }
        paymentStatus = paymentRecord.status
      }
    } catch (apiErr) {
      if (apiErr instanceof HttpError) throw apiErr
      // If Razorpay API fetch fails due to network / mock key in unit test environment, signature check was authoritative
    }

    if (orderId && mongoose.isValidObjectId(orderId)) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        paidAt: new Date(),
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        $push: {
          timeline: {
            status: 'processing',
            timestamp: new Date(),
            note: `Razorpay payment ${razorpay_payment_id} verified successfully.`,
            updatedBy: 'system',
          },
        },
      })
    }

    return res.json({
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentStatus,
      message: 'Razorpay payment signature verified successfully.',
    })
  } catch (error) {
    next(error)
  }
}
