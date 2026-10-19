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
const Review = require('../src/models/Review')
require('../src/config/env')

describe('Product Reviews & Ratings System Tests', () => {
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
      name: 'Reviewer Customer',
      email: `reviewer-${Date.now()}@example.com`,
      phone: '+919876543210',
      password: passwordHash,
      role: 'customer',
    })
    customerToken = jwt.sign({ sub: String(customerUser._id), role: 'customer' }, process.env.JWT_SECRET)

    customer2User = await User.create({
      name: 'Second Reviewer',
      email: `reviewer2-${Date.now()}@example.com`,
      phone: '+919876543211',
      password: passwordHash,
      role: 'customer',
    })
    customer2Token = jwt.sign({ sub: String(customer2User._id), role: 'customer' }, process.env.JWT_SECRET)

    vendorUser = await User.create({
      name: 'Store Vendor',
      email: `vendor-rev-${Date.now()}@example.com`,
      phone: '+919876543212',
      password: passwordHash,
      role: 'vendor',
    })

    approvedVendor = await Vendor.create({
      owner: vendorUser._id,
      storeName: `Elite Store ${Date.now()}`,
      description: 'Official electronics verified seller.',
      status: 'approved',
      isPublic: true,
      kycDocument: {
        storageKey: 'kyc-approved.pdf',
        mimeType: 'application/pdf',
        uploadedAt: new Date(),
      },
    })

    testCategory = await Category.create({
      name: `Audio Gear ${Date.now()}`,
      slug: `audio-gear-${Date.now()}`,
      isActive: true,
    })

    testProduct = await Product.create({
      vendor: approvedVendor._id,
      category: testCategory._id,
      name: 'Wireless Studio ANC Headphones',
      slug: `studio-anc-headphones-${Date.now()}`,
      description: 'High-fidelity audio headphones with active noise cancellation.',
      price: 4999,
      salePrice: 3999,
      stock: 25,
      currency: 'INR',
      status: 'active',
    })
  })

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve))
    if (testProduct) await Product.findByIdAndDelete(testProduct._id)
    if (testCategory) await Category.findByIdAndDelete(testCategory._id)
    if (approvedVendor) await Vendor.findByIdAndDelete(approvedVendor._id)
    if (customerUser) await User.findByIdAndDelete(customerUser._id)
    if (customer2User) await User.findByIdAndDelete(customer2User._id)
    if (vendorUser) await User.findByIdAndDelete(vendorUser._id)
    await Review.deleteMany({ product: testProduct?._id })
    await mongoose.connection.close()
  })

  test('Public review listing: returns empty review list with 0 average initially', async () => {
    const res = await fetch(`${baseUrl}/api/reviews/product/${testProduct._id}`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(Array.isArray(data.items), true)
    assert.equal(data.items.length, 0)
    assert.equal(data.summary.averageRating, 0)
    assert.equal(data.summary.totalReviews, 0)
  })

  test('Review creation: rejects unauthenticated submission with 401', async () => {
    const res = await fetch(`${baseUrl}/api/reviews/product/${testProduct._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, title: 'Amazing', comment: 'Great sound quality!' }),
    })
    assert.equal(res.status, 401)
  })

  test('Review creation: rejects invalid rating (e.g. 6 stars or 0 stars) with 400', async () => {
    const res = await fetch(`${baseUrl}/api/reviews/product/${testProduct._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ rating: 6, title: 'Invalid Rating', comment: 'Should be rejected.' }),
    })
    assert.equal(res.status, 400)
  })

  test('Review creation: submits 5-star review, updates product rating aggregate', async () => {
    const res = await fetch(`${baseUrl}/api/reviews/product/${testProduct._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        title: 'Outstanding Clarity & Bass',
        comment: 'These are hands down the best headphones in this price category!',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.review.rating, 5)
    assert.equal(data.review.title, 'Outstanding Clarity & Bass')
    assert.equal(data.review.user.name, customerUser.name)

    // Verify product model now reflects new rating
    const updatedProd = await Product.findById(testProduct._id)
    assert.equal(updatedProd.rating, 5)
    assert.equal(updatedProd.numReviews, 1)
  })

  test('Verified purchase: detects paid order for buyer', async () => {
    // Create a paid order for customer 2
    await Order.create({
      orderNumber: `ORD-TEST-${Date.now()}`,
      customer: customer2User._id,
      items: [
        {
          product: testProduct._id,
          vendor: approvedVendor._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 1,
          subtotal: testProduct.price,
        },
      ],
      shippingAddress: {
        fullName: 'Second Customer',
        phone: '+919876543211',
        street: '123 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'IN',
      },
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      itemsPrice: testProduct.price,
      totalPrice: testProduct.price,
      status: 'delivered',
    })

    const res = await fetch(`${baseUrl}/api/reviews/product/${testProduct._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer2Token}`,
      },
      body: JSON.stringify({
        rating: 4,
        title: 'Very comfortable for work calls',
        comment: 'Battery lasts over 30 hours. Active noise cancellation is solid.',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.review.isVerifiedPurchase, true)

    // Aggregate rating should now be (5 + 4) / 2 = 4.5
    const updatedProd = await Product.findById(testProduct._id)
    assert.equal(updatedProd.rating, 4.5)
    assert.equal(updatedProd.numReviews, 2)
  })

  test('Public review summary & breakdown distribution', async () => {
    const res = await fetch(`${baseUrl}/api/reviews/product/${testProduct._id}`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.items.length, 2)
    assert.equal(data.summary.averageRating, 4.5)
    assert.equal(data.summary.totalReviews, 2)
    assert.equal(data.summary.ratingCounts[5], 1)
    assert.equal(data.summary.ratingCounts[4], 1)
  })

  test('Helpful vote: allows user to toggle helpful count', async () => {
    const listRes = await fetch(`${baseUrl}/api/reviews/product/${testProduct._id}`)
    const listData = await listRes.json()
    const firstReview = listData.items[0]

    // Vote helpful
    const voteRes = await fetch(`${baseUrl}/api/reviews/${firstReview.id}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
    })
    assert.equal(voteRes.status, 200)
    const voteData = await voteRes.json()
    assert.equal(voteData.review.helpfulCount, 1)

    // Un-vote
    const unvoteRes = await fetch(`${baseUrl}/api/reviews/${firstReview.id}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
    })
    assert.equal(unvoteRes.status, 200)
    const unvoteData = await unvoteRes.json()
    assert.equal(unvoteData.review.helpfulCount, 0)
  })

  test('Public store profile: GET /api/public/stores/:id returns approved store details', async () => {
    const res = await fetch(`${baseUrl}/api/public/stores/${approvedVendor._id}`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.store.id, String(approvedVendor._id))
    assert.equal(data.store.name, approvedVendor.storeName)
  })
})
