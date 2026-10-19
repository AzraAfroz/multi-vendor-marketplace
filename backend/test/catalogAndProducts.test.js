const { test, describe, before, after } = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const app = require('../src/app')
const connectDatabase = require('../src/config/database')
const User = require('../src/models/User')
const Vendor = require('../src/models/Vendor')
const Category = require('../src/models/Category')
const Brand = require('../src/models/Brand')
const Product = require('../src/models/Product')
require('../src/config/env')

describe('Admin Catalog & Vendor Product Management Tests', () => {
  let server
  let baseUrl
  let adminToken
  let approvedVendorToken
  let approvedVendorDoc
  let approvedVendorTwoToken
  let approvedVendorTwoDoc
  let pendingVendorToken
  let customerToken

  const createdUserIds = []
  const createdVendorIds = []
  const createdCategoryIds = []
  const createdBrandIds = []
  const createdProductIds = []

  function authHeader(token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
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

    // Setup Admin
    const adminUser = await User.create({
      name: 'Test Admin',
      email: `admin_${Date.now()}@example.com`,
      phone: '1234567890',
      password: 'hashedpassword',
      role: 'admin',
    })
    createdUserIds.push(adminUser._id)
    adminToken = jwt.sign({ sub: adminUser.id, role: 'admin' }, process.env.JWT_SECRET)

    // Setup Customer
    const customerUser = await User.create({
      name: 'Test Customer',
      email: `customer_${Date.now()}@example.com`,
      phone: '1234567891',
      password: 'hashedpassword',
      role: 'customer',
    })
    createdUserIds.push(customerUser._id)
    customerToken = jwt.sign({ sub: customerUser.id, role: 'customer' }, process.env.JWT_SECRET)

    // Setup Pending Vendor
    const pendingUser = await User.create({
      name: 'Pending Vendor User',
      email: `pending_${Date.now()}@example.com`,
      phone: '1234567892',
      password: 'hashedpassword',
      role: 'vendor',
    })
    createdUserIds.push(pendingUser._id)
    const pendingVendor = await Vendor.create({
      owner: pendingUser._id,
      storeName: `Pending Store ${Date.now()}`,
      status: 'pending',
    })
    createdVendorIds.push(pendingVendor._id)
    pendingVendorToken = jwt.sign({ sub: pendingUser.id, role: 'vendor' }, process.env.JWT_SECRET)

    // Setup Approved Vendor 1
    const approvedUser = await User.create({
      name: 'Approved Vendor User',
      email: `approved1_${Date.now()}@example.com`,
      phone: '1234567893',
      password: 'hashedpassword',
      role: 'vendor',
    })
    createdUserIds.push(approvedUser._id)
    approvedVendorDoc = await Vendor.create({
      owner: approvedUser._id,
      storeName: `Approved Store One ${Date.now()}`,
      status: 'approved',
    })
    createdVendorIds.push(approvedVendorDoc._id)
    approvedVendorToken = jwt.sign({ sub: approvedUser.id, role: 'vendor' }, process.env.JWT_SECRET)

    // Setup Approved Vendor 2 (for multi-tenant isolation testing)
    const approvedUserTwo = await User.create({
      name: 'Approved Vendor Two',
      email: `approved2_${Date.now()}@example.com`,
      phone: '1234567894',
      password: 'hashedpassword',
      role: 'vendor',
    })
    createdUserIds.push(approvedUserTwo._id)
    approvedVendorTwoDoc = await Vendor.create({
      owner: approvedUserTwo._id,
      storeName: `Approved Store Two ${Date.now()}`,
      status: 'approved',
    })
    createdVendorIds.push(approvedVendorTwoDoc._id)
    approvedVendorTwoToken = jwt.sign({ sub: approvedUserTwo.id, role: 'vendor' }, process.env.JWT_SECRET)
  })

  after(async () => {
    // Clean up all test artifacts
    if (createdProductIds.length) await Product.deleteMany({ _id: { $in: createdProductIds } })
    if (createdCategoryIds.length) await Category.deleteMany({ _id: { $in: createdCategoryIds } })
    if (createdBrandIds.length) await Brand.deleteMany({ _id: { $in: createdBrandIds } })
    if (createdVendorIds.length) await Vendor.deleteMany({ _id: { $in: createdVendorIds } })
    if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } })

    if (server) await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
  })

  // ======================== ADMIN CATEGORY MANAGEMENT ========================

  let createdCategoryId
  let createdBrandId

  test('Admin categories: reject unauthenticated and non-admin requests', async () => {
    const unauthRes = await fetch(`${baseUrl}/api/admin/categories`)
    assert.equal(unauthRes.status, 401)

    const customerRes = await fetch(`${baseUrl}/api/admin/categories`, {
      headers: authHeader(customerToken),
    })
    assert.equal(customerRes.status, 403)

    const vendorRes = await fetch(`${baseUrl}/api/admin/categories`, {
      headers: authHeader(approvedVendorToken),
    })
    assert.equal(vendorRes.status, 403)
  })

  test('Admin: create category with validation and slug generation', async () => {
    const invalidRes = await fetch(`${baseUrl}/api/admin/categories`, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({ name: 'A' }),
    })
    assert.equal(invalidRes.status, 400)

    const res = await fetch(`${baseUrl}/api/admin/categories`, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({
        name: 'Home & Kitchen Appliances',
        description: 'Quality appliances for cooking and cleaning',
        sortOrder: 1,
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.ok(data.category)
    assert.equal(data.category.name, 'Home & Kitchen Appliances')
    assert.equal(data.category.slug, 'home-kitchen-appliances')
    assert.equal(data.category.isActive, true)
    createdCategoryId = data.category._id
    createdCategoryIds.push(createdCategoryId)

    // Verify saved directly in MongoDB
    const inDb = await Category.findById(createdCategoryId)
    assert.ok(inDb)
    assert.equal(inDb.name, 'Home & Kitchen Appliances')
  })

  test('Admin: list categories and retrieve single category by ID', async () => {
    const listRes = await fetch(`${baseUrl}/api/admin/categories`, {
      headers: authHeader(adminToken),
    })
    assert.equal(listRes.status, 200)
    const listData = await listRes.json()
    assert.ok(Array.isArray(listData.categories))
    assert.ok(listData.categories.some((c) => String(c._id) === String(createdCategoryId)))

    const getRes = await fetch(`${baseUrl}/api/admin/categories/${createdCategoryId}`, {
      headers: authHeader(adminToken),
    })
    assert.equal(getRes.status, 200)
    const getData = await getRes.json()
    assert.equal(getData.category.name, 'Home & Kitchen Appliances')
  })

  test('Admin: update category name, sortOrder, and toggle isActive', async () => {
    const updateRes = await fetch(`${baseUrl}/api/admin/categories/${createdCategoryId}`, {
      method: 'PATCH',
      headers: authHeader(adminToken),
      body: JSON.stringify({
        name: 'Kitchen & Dining Appliances',
        isActive: false,
      }),
    })
    assert.equal(updateRes.status, 200)
    const updateData = await updateRes.json()
    assert.equal(updateData.category.name, 'Kitchen & Dining Appliances')
    assert.equal(updateData.category.isActive, false)

    // Toggle back to active
    await fetch(`${baseUrl}/api/admin/categories/${createdCategoryId}`, {
      method: 'PATCH',
      headers: authHeader(adminToken),
      body: JSON.stringify({ isActive: true }),
    })
    const inDb = await Category.findById(createdCategoryId)
    assert.equal(inDb.isActive, true)
  })

  // ======================== ADMIN BRAND MANAGEMENT ========================

  test('Admin: create, list, and update brand', async () => {
    const res = await fetch(`${baseUrl}/api/admin/brands`, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({
        name: 'EcoCraft Studio',
        description: 'Handcrafted eco-friendly items',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.ok(data.brand)
    assert.equal(data.brand.name, 'EcoCraft Studio')
    assert.equal(data.brand.slug, 'ecocraft-studio')
    createdBrandId = data.brand._id
    createdBrandIds.push(createdBrandId)

    // Update brand
    const patchRes = await fetch(`${baseUrl}/api/admin/brands/${createdBrandId}`, {
      method: 'PATCH',
      headers: authHeader(adminToken),
      body: JSON.stringify({ description: 'Updated eco description' }),
    })
    assert.equal(patchRes.status, 200)
    const patchData = await patchRes.json()
    assert.equal(patchData.brand.description, 'Updated eco description')
  })

  // ======================== VENDOR PRODUCT MANAGEMENT ========================

  let createdProductId

  test('Vendor products: customer and unapproved vendor are rejected', async () => {
    const customerRes = await fetch(`${baseUrl}/api/vendor/products`, {
      headers: authHeader(customerToken),
    })
    assert.equal(customerRes.status, 403)

    const pendingRes = await fetch(`${baseUrl}/api/vendor/products`, {
      headers: authHeader(pendingVendorToken),
    })
    assert.equal(pendingRes.status, 403)
    const pendingData = await pendingRes.json()
    assert.equal(pendingData.message, 'Your store must be approved by an administrator before managing products.')
  })

  test('Approved vendor: create product with validation and persistence', async () => {
    // Invalid price
    const invalidRes = await fetch(`${baseUrl}/api/vendor/products`, {
      method: 'POST',
      headers: authHeader(approvedVendorToken),
      body: JSON.stringify({
        name: 'Smart Blender',
        category: createdCategoryId,
        price: -10,
      }),
    })
    assert.equal(invalidRes.status, 400)

    // Sale price higher than regular price
    const invalidSaleRes = await fetch(`${baseUrl}/api/vendor/products`, {
      method: 'POST',
      headers: authHeader(approvedVendorToken),
      body: JSON.stringify({
        name: 'Smart Blender',
        category: createdCategoryId,
        price: 100,
        salePrice: 150,
      }),
    })
    assert.equal(invalidSaleRes.status, 400)

    // Valid product creation
    const res = await fetch(`${baseUrl}/api/vendor/products`, {
      method: 'POST',
      headers: authHeader(approvedVendorToken),
      body: JSON.stringify({
        name: 'Smart High-Speed Blender',
        description: 'Powerful 1200W motor with 6 preset functions',
        category: createdCategoryId,
        brand: createdBrandId,
        price: 129.99,
        salePrice: 99.99,
        stock: 25,
        currency: 'USD',
        status: 'active',
        images: [{ url: '/uploads/products/blender.jpg', alt: 'Front view' }],
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.ok(data.product)
    assert.equal(data.product.name, 'Smart High-Speed Blender')
    assert.equal(data.product.price, 129.99)
    assert.equal(data.product.salePrice, 99.99)
    assert.equal(data.product.stock, 25)
    assert.equal(data.product.status, 'active')
    assert.equal(String(data.product.vendor), String(approvedVendorDoc._id))
    createdProductId = data.product._id
    createdProductIds.push(createdProductId)

    // Verify stored directly in MongoDB
    const inDb = await Product.findById(createdProductId)
    assert.ok(inDb)
    assert.equal(inDb.name, 'Smart High-Speed Blender')
    assert.equal(inDb.stock, 25)
  })

  test('Approved vendor: list own products and filter by status', async () => {
    const res = await fetch(`${baseUrl}/api/vendor/products`, {
      headers: authHeader(approvedVendorToken),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(Array.isArray(data.items))
    assert.ok(data.items.some((p) => String(p._id) === String(createdProductId)))

    const filteredRes = await fetch(`${baseUrl}/api/vendor/products?status=active`, {
      headers: authHeader(approvedVendorToken),
    })
    assert.equal(filteredRes.status, 200)
    const filteredData = await filteredRes.json()
    assert.ok(filteredData.items.some((p) => String(p._id) === String(createdProductId)))
  })

  test('Multi-tenant isolation: Vendor 2 cannot access or modify Vendor 1 product', async () => {
    const getRes = await fetch(`${baseUrl}/api/vendor/products/${createdProductId}`, {
      headers: authHeader(approvedVendorTwoToken),
    })
    assert.equal(getRes.status, 404)

    const patchRes = await fetch(`${baseUrl}/api/vendor/products/${createdProductId}`, {
      method: 'PATCH',
      headers: authHeader(approvedVendorTwoToken),
      body: JSON.stringify({ price: 10 }),
    })
    assert.equal(patchRes.status, 404)

    const deleteRes = await fetch(`${baseUrl}/api/vendor/products/${createdProductId}`, {
      method: 'DELETE',
      headers: authHeader(approvedVendorTwoToken),
    })
    assert.equal(deleteRes.status, 404)

    // Price remains unchanged in DB
    const inDb = await Product.findById(createdProductId)
    assert.equal(inDb.price, 129.99)
  })

  test('Approved vendor: update product price, stock, and status', async () => {
    const res = await fetch(`${baseUrl}/api/vendor/products/${createdProductId}`, {
      method: 'PATCH',
      headers: authHeader(approvedVendorToken),
      body: JSON.stringify({
        stock: 50,
        price: 139.99,
        salePrice: 109.99,
        status: 'draft',
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.product.stock, 50)
    assert.equal(data.product.price, 139.99)
    assert.equal(data.product.salePrice, 109.99)
    assert.equal(data.product.status, 'draft')
  })

  test('Admin: reject duplicate category with 409 and field-level error', async () => {
    const dupRes = await fetch(`${baseUrl}/api/admin/categories`, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({
        name: 'Home & Kitchen Appliances',
      }),
    })
    assert.equal(dupRes.status, 409)
    const dupData = await dupRes.json()
    assert.ok(dupData.errors.name || dupData.errors.slug)
  })

  test('Admin: prevent circular parent-child category relationship', async () => {
    // Create a child category
    const childRes = await fetch(`${baseUrl}/api/admin/categories`, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({
        name: 'Small Kitchen Appliances',
        parent: createdCategoryId,
      }),
    })
    assert.equal(childRes.status, 201)
    const childData = await childRes.json()
    const childId = childData.category._id
    createdCategoryIds.push(childId)

    // Attempt to update parent category so its parent is its own child
    const cycleRes = await fetch(`${baseUrl}/api/admin/categories/${createdCategoryId}`, {
      method: 'PATCH',
      headers: authHeader(adminToken),
      body: JSON.stringify({
        parent: childId,
      }),
    })
    assert.equal(cycleRes.status, 400)
    const cycleData = await cycleRes.json()
    assert.ok(cycleData.errors.parent)

    // Clean up child category
    await fetch(`${baseUrl}/api/admin/categories/${childId}`, {
      method: 'DELETE',
      headers: authHeader(adminToken),
    })
  })

  test('Admin: reject duplicate brand with 409 and field-level error', async () => {
    const dupRes = await fetch(`${baseUrl}/api/admin/brands`, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({
        name: 'EcoCraft Studio',
      }),
    })
    assert.equal(dupRes.status, 409)
    const dupData = await dupRes.json()
    assert.ok(dupData.errors.name || dupData.errors.slug)
  })

  test('Category and Brand deletion protection: cannot delete if referenced by products', async () => {
    // Category deletion blocked by product
    const catRes = await fetch(`${baseUrl}/api/admin/categories/${createdCategoryId}`, {
      method: 'DELETE',
      headers: authHeader(adminToken),
    })
    assert.equal(catRes.status, 409)
    const catData = await catRes.json()
    assert.ok(catData.message.includes('reference it') || catData.message.includes('referencing it'))

    // Brand deletion blocked by product
    const brandRes = await fetch(`${baseUrl}/api/admin/brands/${createdBrandId}`, {
      method: 'DELETE',
      headers: authHeader(adminToken),
    })
    assert.equal(brandRes.status, 409)
    const brandData = await brandRes.json()
    assert.ok(brandData.message.includes('reference it') || brandData.message.includes('referencing it'))
  })

  test('Approved vendor: delete product and verify removal from MongoDB', async () => {
    const res = await fetch(`${baseUrl}/api/vendor/products/${createdProductId}`, {
      method: 'DELETE',
      headers: authHeader(approvedVendorToken),
    })
    assert.equal(res.status, 200)

    const inDb = await Product.findById(createdProductId)
    assert.equal(inDb, null)
  })

  test('Admin: successfully delete category and brand after referencing products are removed', async () => {
    // Delete category
    const catRes = await fetch(`${baseUrl}/api/admin/categories/${createdCategoryId}`, {
      method: 'DELETE',
      headers: authHeader(adminToken),
    })
    assert.equal(catRes.status, 200)
    const catInDb = await Category.findById(createdCategoryId)
    assert.equal(catInDb, null)

    // Delete brand
    const brandRes = await fetch(`${baseUrl}/api/admin/brands/${createdBrandId}`, {
      method: 'DELETE',
      headers: authHeader(adminToken),
    })
    assert.equal(brandRes.status, 200)
    const brandInDb = await Brand.findById(createdBrandId)
    assert.equal(brandInDb, null)
  })

  test('Public Catalog: verified category & brand toggle isActive - deactivated items drop out of public listing and filters', async () => {
    // Create new test category & brand
    const catRes = await fetch(`${baseUrl}/api/admin/categories`, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({ name: 'Active Catalog Category' }),
    })
    assert.equal(catRes.status, 201)
    const cat = (await catRes.json()).category
    createdCategoryIds.push(cat._id)

    const brandRes = await fetch(`${baseUrl}/api/admin/brands`, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({ name: 'Active Catalog Brand' }),
    })
    assert.equal(brandRes.status, 201)
    const brand = (await brandRes.json()).brand
    createdBrandIds.push(brand._id)

    // Verify present in public endpoints
    const pubCatRes1 = await fetch(`${baseUrl}/api/public/categories`)
    const pubCatData1 = await pubCatRes1.json()
    assert.ok(pubCatData1.categories.items.some((c) => c.id === String(cat._id)))

    const pubBrandRes1 = await fetch(`${baseUrl}/api/public/brands`)
    const pubBrandData1 = await pubBrandRes1.json()
    assert.ok(pubBrandData1.brands.items.some((b) => b.id === String(brand._id)))

    // Deactivate both
    await fetch(`${baseUrl}/api/admin/categories/${cat._id}`, {
      method: 'PATCH',
      headers: authHeader(adminToken),
      body: JSON.stringify({ isActive: false }),
    })
    await fetch(`${baseUrl}/api/admin/brands/${brand._id}`, {
      method: 'PATCH',
      headers: authHeader(adminToken),
      body: JSON.stringify({ isActive: false }),
    })

    // Verify immediately excluded from public endpoints
    const pubCatRes2 = await fetch(`${baseUrl}/api/public/categories`)
    const pubCatData2 = await pubCatRes2.json()
    assert.ok(!pubCatData2.categories.items.some((c) => c.id === String(cat._id)))

    const pubBrandRes2 = await fetch(`${baseUrl}/api/public/brands`)
    const pubBrandData2 = await pubBrandRes2.json()
    assert.ok(!pubBrandData2.brands.items.some((b) => b.id === String(brand._id)))
  })
})
