const { test, describe, before, after } = require('node:test')
const assert = require('node:assert/strict')
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

describe('Multi-Vendor Order Management & Checkout Tests', () => {
  let server
  let baseUrl

  // Test entities
  let customerUser
  let customerToken
  let customer2User
  let customer2Token
  let vendorUser
  let vendorToken
  let approvedVendor
  let adminUser
  let adminToken
  let testCategory
  let testProduct

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

    // Create Customer
    customerUser = await User.create({
      name: 'Order Customer',
      email: `customer-${Date.now()}@example.com`,
      phone: '+15551234567',
      password: passwordHash,
      role: 'customer',
    })
    customerToken = jwt.sign({ sub: String(customerUser._id), role: 'customer' }, process.env.JWT_SECRET)

    // Create Customer 2 for multi-tenant customer tests
    customer2User = await User.create({
      name: 'Order Customer 2',
      email: `customer2-${Date.now()}@example.com`,
      phone: '+15559876543',
      password: passwordHash,
      role: 'customer',
    })
    customer2Token = jwt.sign({ sub: String(customer2User._id), role: 'customer' }, process.env.JWT_SECRET)

    // Create Admin
    adminUser = await User.create({
      name: 'Order Admin',
      email: `admin-${Date.now()}@example.com`,
      phone: '+15550001111',
      password: passwordHash,
      role: 'admin',
    })
    adminToken = jwt.sign({ sub: String(adminUser._id), role: 'admin' }, process.env.JWT_SECRET)

    // Create Approved Vendor
    vendorUser = await User.create({
      name: 'Order Vendor Owner',
      email: `vendor-${Date.now()}@example.com`,
      phone: '+15552223333',
      password: passwordHash,
      role: 'vendor',
    })
    vendorToken = jwt.sign({ sub: String(vendorUser._id), role: 'vendor' }, process.env.JWT_SECRET)

    approvedVendor = await Vendor.create({
      owner: vendorUser._id,
      storeName: `Order Vendor Store ${Date.now()}`,
      status: 'approved',
      isPublic: true,
    })

    // Create Category
    testCategory = await Category.create({
      name: `Order Category ${Date.now()}`,
      slug: `order-cat-${Date.now()}`,
      isActive: true,
    })

    // Create Product with stock = 10
    testProduct = await Product.create({
      vendor: approvedVendor._id,
      category: testCategory._id,
      name: 'Test Shopping Gadget',
      slug: `test-shopping-gadget-${Date.now()}`,
      price: 50,
      salePrice: 40, // $40 sale price
      stock: 10,
      status: 'active',
      images: [{ url: 'https://images.example.com/gadget.jpg', alt: 'Gadget' }],
    })
  })

  after(async () => {
    // Teardown test entities
    await Order.deleteMany({ customer: { $in: [customerUser?._id, customer2User?._id] } })
    if (testProduct) await Product.findByIdAndDelete(testProduct._id)
    if (testCategory) await Category.findByIdAndDelete(testCategory._id)
    if (approvedVendor) await Vendor.findByIdAndDelete(approvedVendor._id)
    if (customerUser) await User.findByIdAndDelete(customerUser._id)
    if (customer2User) await User.findByIdAndDelete(customer2User._id)
    if (vendorUser) await User.findByIdAndDelete(vendorUser._id)
    if (adminUser) await User.findByIdAndDelete(adminUser._id)

    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await mongoose.disconnect()
  })

  test('POST /api/orders rejects unauthenticated requests', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    })
    assert.equal(res.status, 401)
  })

  test('POST /api/orders rejects empty items or invalid address', async () => {
    const resEmpty = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ items: [] }),
    })
    assert.equal(resEmpty.status, 400)

    const resNoAddress = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 1 }],
        shippingAddress: {},
      }),
    })
    assert.equal(resNoAddress.status, 400)
  })

  test('POST /api/orders rejects order if quantity exceeds stock', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 999 }],
        shippingAddress: {
          fullName: 'Jane Doe',
          phone: '555-1234',
          street: '123 Market St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
        },
      }),
    })
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.message.includes('Insufficient stock'))
  })

  test('POST /api/orders/validate-cart validates valid items and calculates prices accurately', async () => {
    const res = await fetch(`${baseUrl}/api/orders/validate-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.valid, true)
    assert.equal(data.items.length, 1)
    assert.equal(data.items[0].price, 40) // salePrice authoritative
    assert.equal(data.items[0].subtotal, 80)
    assert.equal(data.itemsPrice, 80)
    assert.equal(data.shippingPrice, 5) // $80 < $100 -> $5 shipping
    assert.equal(data.totalPrice, 85)
    assert.equal(data.errors.length, 0)
  })

  test('POST /api/orders/validate-cart flags out of stock or insufficient stock items', async () => {
    const res = await fetch(`${baseUrl}/api/orders/validate-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 50 }],
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.valid, false)
    assert.ok(data.errors.length >= 1)
    assert.ok(data.errors[0].includes('Insufficient stock'))
  })

  test('POST /api/orders rejects order if product is inactive or unpublished', async () => {
    // Create inactive product
    const inactiveProduct = await Product.create({
      vendor: approvedVendor._id,
      category: testCategory._id,
      name: 'Discontinued Item',
      slug: `discontinued-item-${Date.now()}`,
      price: 30,
      stock: 5,
      status: 'draft',
    })

    // Test validate-cart detects it
    const resVal = await fetch(`${baseUrl}/api/orders/validate-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: inactiveProduct._id.toString(), quantity: 1 }],
      }),
    })
    assert.equal(resVal.status, 200)
    const valData = await resVal.json()
    assert.equal(valData.valid, false)
    assert.ok(valData.errors[0].includes('no longer available'))

    // Test order placement rejects it
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: inactiveProduct._id.toString(), quantity: 1 }],
        shippingAddress: {
          fullName: 'Jane Customer',
          phone: '555-123-4567',
          street: '123 Market St',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'US',
        },
      }),
    })
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.message.includes('no longer available'))

    await Product.findByIdAndDelete(inactiveProduct._id)
  })

  let createdOrderId

  test('POST /api/orders successfully places order, uses server price, and decrements stock', async () => {
    const initialProduct = await Product.findById(testProduct._id)
    assert.equal(initialProduct.stock, 10)

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 2 }],
        shippingAddress: {
          fullName: 'Jane Customer',
          phone: '555-123-4567',
          street: '456 Commercial Way',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'US',
        },
        paymentMethod: 'card',
      }),
    })

    assert.equal(res.status, 201)
    const data = await res.json()
    assert.ok(data.order)
    assert.ok(data.order.orderNumber.startsWith('ORD-'))
    assert.equal(data.order.items.length, 1)
    assert.equal(data.order.items[0].price, 40) // salePrice was used
    assert.equal(data.order.items[0].quantity, 2)
    assert.equal(data.order.items[0].subtotal, 80)
    assert.equal(data.order.itemsPrice, 80)
    assert.equal(data.order.paymentStatus, 'paid')
    assert.equal(data.order.status, 'pending')

    createdOrderId = data.order.id

    // Verify stock was atomically decremented in MongoDB
    const updatedProduct = await Product.findById(testProduct._id)
    assert.equal(updatedProduct.stock, 8)
  })

  test('GET /api/orders/my-orders returns customer order list', async () => {
    const res = await fetch(`${baseUrl}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.orders.items.length >= 1)
    assert.equal(data.orders.items[0].id, createdOrderId)
  })

  test('GET /api/orders/:id enforces customer ownership isolation', async () => {
    // Customer 1 can access their order
    const resOwner = await fetch(`${baseUrl}/api/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    assert.equal(resOwner.status, 200)

    // Customer 2 cannot access Customer 1's order
    const resStranger = await fetch(`${baseUrl}/api/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    })
    assert.equal(resStranger.status, 404)
  })

  test('GET /api/vendor/orders returns orders containing vendor items', async () => {
    const res = await fetch(`${baseUrl}/api/vendor/orders`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.orders.items.length >= 1)
    const found = data.orders.items.find((o) => o.id === createdOrderId)
    assert.ok(found)
    assert.equal(found.vendorSubtotal, 80)
  })

  test('PATCH /api/vendor/orders/:id/status allows vendor to advance fulfillment', async () => {
    const res = await fetch(`${baseUrl}/api/vendor/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({ status: 'shipped' }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.order.status, 'shipped')
    assert.equal(data.order.items[0].vendorStatus, 'shipped')
  })

  test('GET /api/admin/orders lists all marketplace orders', async () => {
    const res = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.orders.items.length >= 1)
  })

  test('PATCH /api/admin/orders/:id/status allows admin to deliver or cancel', async () => {
    const res = await fetch(`${baseUrl}/api/admin/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'delivered' }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.order.status, 'delivered')
    assert.ok(data.order.deliveredAt)
  })

  test('PATCH /api/orders/:id/cancel enforces ownership, automatically restores stock, and updates timeline', async () => {
    // 1. Create a fresh order for Customer 1 with quantity 3
    const productBefore = await Product.findById(testProduct._id)
    const stockBefore = productBefore.stock

    const createRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id.toString(), quantity: 3 }],
        shippingAddress: {
          fullName: 'Test Cancel Cust',
          phone: '555-999-8888',
          street: '123 Return Way',
          city: 'Portland',
          state: 'OR',
          postalCode: '97201',
          country: 'US',
        },
      }),
    })
    assert.equal(createRes.status, 201)
    const createData = await createRes.json()
    const orderToCancelId = createData.order.id

    // Stock should have decreased by 3
    const productAfterOrder = await Product.findById(testProduct._id)
    assert.equal(productAfterOrder.stock, stockBefore - 3)

    // 2. Customer 2 attempts to cancel Customer 1's order -> 404 forbidden/isolation
    const strangerRes = await fetch(`${baseUrl}/api/orders/${orderToCancelId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer2Token}`,
      },
      body: JSON.stringify({ reason: 'Stranger attempt' }),
    })
    assert.equal(strangerRes.status, 404)

    // 3. Customer 1 cancels their own order
    const cancelRes = await fetch(`${baseUrl}/api/orders/${orderToCancelId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ reason: 'Changed my mind' }),
    })
    assert.equal(cancelRes.status, 200)
    const cancelData = await cancelRes.json()
    assert.equal(cancelData.order.status, 'cancelled')
    assert.equal(cancelData.order.cancelReason, 'Changed my mind')
    assert.equal(cancelData.order.cancelledBy, 'customer')
    assert.ok(cancelData.order.cancelledAt)
    assert.ok(cancelData.order.timeline.length >= 2)
    assert.equal(cancelData.order.timeline[cancelData.order.timeline.length - 1].status, 'cancelled')

    // 4. CRITICAL: Product stock MUST be automatically restored back to stockBefore!
    const productAfterCancel = await Product.findById(testProduct._id)
    assert.equal(productAfterCancel.stock, stockBefore)

    // 5. Attempting to cancel already-cancelled order returns 400
    const reCancelRes = await fetch(`${baseUrl}/api/orders/${orderToCancelId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ reason: 'Try again' }),
    })
    assert.equal(reCancelRes.status, 400)

    // 6. Attempting to cancel already-delivered order returns 400
    const cancelDeliveredRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ reason: 'Too late' }),
    })
    assert.equal(cancelDeliveredRes.status, 400)
  })
})
