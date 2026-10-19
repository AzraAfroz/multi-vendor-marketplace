const { test, describe, before, after } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const app = require('../src/app')
const connectDatabase = require('../src/config/database')
const User = require('../src/models/User')
const Vendor = require('../src/models/Vendor')
const Category = require('../src/models/Category')
const Product = require('../src/models/Product')
const Order = require('../src/models/Order')
require('../src/config/env')

describe('Razorpay Payment Verification & Security Tests', () => {
  let server
  let baseUrl

  let customerUser
  let customerToken
  let customer2User
  let customer2Token
  let vendorUser
  let approvedVendor
  let testCategory
  let testProduct

  const testSecret = (process.env.RAZORPAY_KEY_SECRET || 'test_secret_for_suite_123').trim()
  process.env.RAZORPAY_KEY_SECRET = testSecret
  process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_suite_key_id'

  function generateValidSignature(orderId, paymentId, secret = testSecret) {
    return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex')
  }

  before(async () => {
    await connectDatabase(process.env.MONGODB_URI)
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port
        baseUrl = `http://localhost:${port}`
        resolve()
      })
    })

    const passwordHash = await bcrypt.hash('Secret123!', 10)

    customerUser = await User.create({
      name: 'Payment Customer',
      email: `paycustomer-${Date.now()}@example.com`,
      phone: '+15551234567',
      password: passwordHash,
      role: 'customer',
    })
    customerToken = jwt.sign({ sub: String(customerUser._id), role: 'customer' }, process.env.JWT_SECRET)

    customer2User = await User.create({
      name: 'Payment Customer 2',
      email: `paycustomer2-${Date.now()}@example.com`,
      phone: '+15557654321',
      password: passwordHash,
      role: 'customer',
    })
    customer2Token = jwt.sign({ sub: String(customer2User._id), role: 'customer' }, process.env.JWT_SECRET)

    vendorUser = await User.create({
      name: 'Payment Vendor Owner',
      email: `payvendor-${Date.now()}@example.com`,
      phone: '+15552223333',
      password: passwordHash,
      role: 'vendor',
    })

    approvedVendor = await Vendor.create({
      owner: vendorUser._id,
      storeName: `Payment Verified Store ${Date.now()}`,
      slug: `payment-verified-store-${Date.now()}`,
      status: 'approved',
      commissionRate: 10,
    })

    testCategory = await Category.create({
      name: `Payment Category ${Date.now()}`,
      slug: `pay-cat-${Date.now()}`,
      isActive: true,
    })

    testProduct = await Product.create({
      vendor: approvedVendor._id,
      category: testCategory._id,
      name: `Payment Product ${Date.now()}`,
      slug: `pay-prod-${Date.now()}`,
      price: 150,
      stock: 20,
      status: 'active',
    })
  })

  after(async () => {
    if (customerUser) await User.findByIdAndDelete(customerUser._id)
    if (customer2User) await User.findByIdAndDelete(customer2User._id)
    if (vendorUser) await User.findByIdAndDelete(vendorUser._id)
    if (approvedVendor) await Vendor.findByIdAndDelete(approvedVendor._id)
    if (testCategory) await Category.findByIdAndDelete(testCategory._id)
    if (testProduct) await Product.findByIdAndDelete(testProduct._id)
    await Order.deleteMany({ customer: { $in: [customerUser?._id, customer2User?._id] } })

    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await mongoose.disconnect()
  })

  test('GET /api/payments/razorpay/config returns key ID and INR currency', async () => {
    const res = await fetch(`${baseUrl}/api/payments/razorpay/config`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.currency, 'INR')
    assert.ok(data.keyId)
  })

  test('POST /api/payments/razorpay/verify rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/payments/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'dummy_sig',
      }),
    })
    assert.equal(res.status, 401)
  })

  test('POST /api/payments/razorpay/verify rejects missing payment ID or signature with 400', async () => {
    const res = await fetch(`${baseUrl}/api/payments/razorpay/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: 'order_123',
      }),
    })
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.message.includes('required'))
  })

  test('POST /api/payments/razorpay/verify rejects invalid or forged signature with 400', async () => {
    const res = await fetch(`${baseUrl}/api/payments/razorpay/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd',
      }),
    })
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.message.includes('signature verification failed'))
  })

  test('POST /api/payments/razorpay/verify rejects simulated or fake IDs', async () => {
    const resSimSig = await fetch(`${baseUrl}/api/payments/razorpay/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: 'order_sim_12345',
        razorpay_payment_id: 'pay_sim_67890',
        razorpay_signature: 'simulated_sig_12345',
      }),
    })
    assert.equal(resSimSig.status, 400)
    const data = await resSimSig.json()
    assert.ok(data.message.includes('signature verification failed'))
  })

  test('POST /api/payments/razorpay/verify succeeds with valid cryptographic HMAC SHA-256 signature', async () => {
    const orderId = `order_test_${Date.now()}`
    const paymentId = `pay_test_${Date.now()}`
    const validSignature = generateValidSignature(orderId, paymentId)

    const res = await fetch(`${baseUrl}/api/payments/razorpay/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.verified, true)
    assert.equal(data.orderId, orderId)
    assert.equal(data.paymentId, paymentId)
  })

  test('POST /api/orders rejects Razorpay order with invalid signature and does not decrement stock', async () => {
    const initialProduct = await Product.findById(testProduct._id)
    const initialStock = initialProduct.stock

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        shippingAddress: {
          fullName: 'Security Tester',
          phone: '555-123-4567',
          street: '123 Fake St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
        },
        paymentMethod: 'razorpay',
        razorpayOrderId: 'order_bad_123',
        razorpayPaymentId: 'pay_bad_123',
        razorpaySignature: 'invalid_forged_signature_00000000000000000000000000000000000000000',
      }),
    })
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.message.includes('signature verification failed'))

    // Verify stock was NOT decremented
    const productAfter = await Product.findById(testProduct._id)
    assert.equal(productAfter.stock, initialStock)
  })

  test('POST /api/orders with paymentMethod razorpay and missing payment details creates order in pending status', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        shippingAddress: {
          fullName: 'Pending Buyer',
          phone: '555-987-6543',
          street: '123 Market St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
        },
        paymentMethod: 'razorpay',
        // No payment ID or signature provided (order placed prior to online payment)
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.order.paymentMethod, 'razorpay')
    assert.equal(data.order.paymentStatus, 'pending')
    assert.equal(data.order.paidAt, null)
    assert.equal(data.order.razorpayPaymentId, null)
    assert.equal(data.order.razorpaySignature, null)
  })

  test('POST /api/orders with paymentStatus failed creates order in failed state and does not decrement stock', async () => {
    const initialProduct = await Product.findById(testProduct._id)
    const initialStock = initialProduct.stock

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        shippingAddress: {
          fullName: 'Failed Buyer',
          phone: '555-000-1111',
          street: '404 Declined Rd',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
        },
        paymentMethod: 'razorpay',
        paymentStatus: 'failed',
        razorpayOrderId: 'order_declined_123',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.order.paymentStatus, 'failed')
    assert.equal(data.order.paidAt, null)

    // Stock must remain unchanged for failed payment
    const productAfter = await Product.findById(testProduct._id)
    assert.equal(productAfter.stock, initialStock)
  })

  test('POST /api/orders with valid HMAC SHA-256 signature creates order with paymentStatus paid', async () => {
    const razorpayOrderId = `order_verified_${Date.now()}`
    const razorpayPaymentId = `pay_verified_${Date.now()}`
    const razorpaySignature = generateValidSignature(razorpayOrderId, razorpayPaymentId)

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        shippingAddress: {
          fullName: 'Verified Buyer',
          phone: '555-555-5555',
          street: '777 Success Blvd',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
        },
        paymentMethod: 'razorpay',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.order.paymentMethod, 'razorpay')
    assert.equal(data.order.paymentStatus, 'paid')
    assert.ok(data.order.paidAt)
    assert.equal(data.order.razorpayOrderId, razorpayOrderId)
    assert.equal(data.order.razorpayPaymentId, razorpayPaymentId)
    assert.equal(data.order.razorpaySignature, razorpaySignature)
  })

  test('POST /api/orders/:id/confirm-payment rejects invalid signature and marks order failed', async () => {
    // 1. Create a pending order
    const createRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        shippingAddress: {
          fullName: 'Pending Buyer',
          phone: '555-987-6543',
          street: '123 Market St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
        },
        paymentMethod: 'razorpay',
      }),
    })
    const { order } = await createRes.json()
    assert.equal(order.paymentStatus, 'pending')

    // 2. Attempt confirm with invalid signature
    const confirmRes = await fetch(`${baseUrl}/api/orders/${order.id}/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        razorpayOrderId: 'order_test_pending',
        razorpayPaymentId: 'pay_test_pending',
        razorpaySignature: 'tampered_signature_hex_digest_0000000000000000000000000000000000000',
      }),
    })
    assert.equal(confirmRes.status, 400)

    // 3. Verify order in DB was updated to 'failed'
    const updatedOrder = await Order.findById(order.id)
    assert.equal(updatedOrder.paymentStatus, 'failed')
  })

  test('POST /api/orders/:id/confirm-payment successfully marks pending order as paid with valid signature', async () => {
    // 1. Create a pending order
    const createRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        shippingAddress: {
          fullName: 'Pending Buyer',
          phone: '555-987-6543',
          street: '123 Market St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
        },
        paymentMethod: 'razorpay',
      }),
    })
    const { order } = await createRes.json()
    assert.equal(order.paymentStatus, 'pending')

    // 2. Generate valid signature and confirm
    const rzpOrderId = `order_confirm_${Date.now()}`
    const rzpPayId = `pay_confirm_${Date.now()}`
    const validSig = generateValidSignature(rzpOrderId, rzpPayId)

    const confirmRes = await fetch(`${baseUrl}/api/orders/${order.id}/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPayId,
        razorpaySignature: validSig,
      }),
    })
    assert.equal(confirmRes.status, 200)
    const confirmedData = await confirmRes.json()
    assert.equal(confirmedData.order.paymentStatus, 'paid')
    assert.ok(confirmedData.order.paidAt)
    assert.equal(confirmedData.order.razorpayOrderId, rzpOrderId)
    assert.equal(confirmedData.order.razorpayPaymentId, rzpPayId)

    // 3. Verify customer isolation: Customer 2 cannot confirm Customer 1 order
    const unauthorizedRes = await fetch(`${baseUrl}/api/orders/${order.id}/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer2Token}`,
      },
      body: JSON.stringify({
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPayId,
        razorpaySignature: validSig,
      }),
    })
    assert.equal(unauthorizedRes.status, 403)
  })
})