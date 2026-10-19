const { test, describe, before, after } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const app = require('../src/app')
const connectDatabase = require('../src/config/database')
require('../src/config/env')

describe('Public Catalog API Tests', () => {
  let server
  let baseUrl

  before(async () => {
    await connectDatabase(process.env.MONGODB_URI)
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port
        baseUrl = `http://localhost:${port}`
        resolve()
      })
    })
  })

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await mongoose.disconnect()
  })

  test('GET /api/health returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.deepEqual(data, { status: 'ok' })
  })

  test('GET /api/public/categories returns valid pagination and items array', async () => {
    const res = await fetch(`${baseUrl}/api/public/categories`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.categories)
    assert.ok(Array.isArray(data.categories.items))
    assert.equal(typeof data.categories.pagination.page, 'number')
    assert.equal(typeof data.categories.pagination.limit, 'number')
    assert.equal(typeof data.categories.pagination.total, 'number')
  })

  test('GET /api/public/brands returns valid pagination and items array', async () => {
    const res = await fetch(`${baseUrl}/api/public/brands`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.brands)
    assert.ok(Array.isArray(data.brands.items))
    assert.equal(typeof data.brands.pagination.page, 'number')
  })

  test('GET /api/public/stores returns only approved stores and no private KYC documents', async () => {
    const res = await fetch(`${baseUrl}/api/public/stores`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.stores)
    assert.ok(Array.isArray(data.stores.items))
    // Verify no private KYC document or owner password is ever leaked in stores
    for (const store of data.stores.items) {
      assert.equal(store.kycDocument, undefined)
      assert.equal(store.owner, undefined)
      assert.equal(store.password, undefined)
    }
  })

  test('GET /api/public/products returns valid pagination and items array', async () => {
    const res = await fetch(`${baseUrl}/api/public/products`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.products)
    assert.ok(Array.isArray(data.products.items))
    assert.equal(typeof data.products.pagination.page, 'number')
  })

  test('GET /api/public/products rejects invalid query parameters', async () => {
    const resPage = await fetch(`${baseUrl}/api/public/products?page=0`)
    assert.equal(resPage.status, 400)

    const resLimit = await fetch(`${baseUrl}/api/public/products?limit=100`)
    assert.equal(resLimit.status, 400)

    const resSort = await fetch(`${baseUrl}/api/public/products?sort=hacked`)
    assert.equal(resSort.status, 400)

    const resCategory = await fetch(`${baseUrl}/api/public/products?category=invalid-id`)
    assert.equal(resCategory.status, 400)
  })

  test('GET /api/public/products/:id rejects malformed ID with 400', async () => {
    const res = await fetch(`${baseUrl}/api/public/products/not-a-valid-id`)
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.equal(data.message, 'Product ID must be a valid ID.')
  })

  test('GET /api/public/products/:id returns 404 for non-existent product ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await fetch(`${baseUrl}/api/public/products/${fakeId}`)
    assert.equal(res.status, 404)
    const data = await res.json()
    assert.equal(data.message, 'Product was not found.')
  })
})
