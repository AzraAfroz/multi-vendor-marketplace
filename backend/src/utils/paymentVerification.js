const crypto = require('node:crypto')

/**
 * Cryptographically verifies Razorpay payment signature using HMAC SHA-256.
 * Rejects simulated, hardcoded, or forged signatures in constant time.
 *
 * @param {string} orderId - Razorpay order ID (e.g. order_O82b4n...)
 * @param {string} paymentId - Razorpay payment ID (e.g. pay_O82c5m...)
 * @param {string} signature - Razorpay HMAC SHA-256 hex signature
 * @param {string} secret - Merchant Razorpay Key Secret
 * @returns {boolean} true if signature is cryptographically valid, false otherwise
 */
function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) {
    return false
  }

  // Reject simulated or fake IDs
  if (
    typeof signature !== 'string' ||
    typeof orderId !== 'string' ||
    typeof paymentId !== 'string' ||
    signature.startsWith('simulated_') ||
    orderId.startsWith('order_sim_') ||
    paymentId.startsWith('pay_sim_')
  ) {
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expectedSignature.length !== signature.length) {
      return false
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    )
  } catch {
    return false
  }
}

module.exports = {
  verifyRazorpaySignature,
}
