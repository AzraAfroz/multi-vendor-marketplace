const crypto = require('node:crypto')
const mongoose = require('mongoose')
const Product = require('../models/Product')
const Category = require('../models/Category')
const Brand = require('../models/Brand')
const HttpError = require('../utils/HttpError')
const slugify = require('../utils/slugify')

const MAX_LIMIT = 50

function validateId(id, name = 'ID') {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw new HttpError(400, `${name} must be a valid ID.`)
  }
  return new mongoose.Types.ObjectId(id)
}

function pagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1) throw new HttpError(400, 'page must be a positive integer.')
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw new HttpError(400, `limit must be an integer from 1 to ${MAX_LIMIT}.`)
  return { page, limit, skip: (page - 1) * limit }
}

function formatImages(rawImages) {
  if (!Array.isArray(rawImages)) return []
  return rawImages.map((img) => {
    if (typeof img === 'string') return { url: img.trim(), alt: '' }
    if (img && typeof img.url === 'string') return { url: img.url.trim(), alt: typeof img.alt === 'string' ? img.alt.trim() : '' }
    return null
  }).filter((img) => img && img.url)
}

async function generateUniqueSlug(vendorId, baseName, currentProductId = null) {
  let baseSlug = slugify(baseName) || 'product'
  let slug = baseSlug
  let counter = 0

  while (true) {
    const existing = await Product.findOne({ vendor: vendorId, slug })
    if (!existing || (currentProductId && String(existing._id) === String(currentProductId))) {
      return slug
    }
    counter += 1
    slug = `${baseSlug}-${counter}-${crypto.randomBytes(2).toString('hex')}`
  }
}

async function listProducts(vendorId, query = {}) {
  const { page, limit, skip } = pagination(query)
  const filter = { vendor: vendorId }

  if (query.category) {
    filter.category = validateId(query.category, 'Category')
  }
  if (query.brand) {
    filter.brand = validateId(query.brand, 'Brand')
  }
  if (query.status && query.status !== 'all') {
    if (!['draft', 'active', 'archived'].includes(query.status)) {
      throw new HttpError(400, 'status must be draft, active, archived, or all.')
    }
    filter.status = query.status
  }

  if (query.q && typeof query.q === 'string' && query.q.trim()) {
    const escaped = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'i')
    filter.$or = [{ name: regex }, { description: regex }]
  }

  const [records, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug imageUrl isActive')
      .populate('brand', 'name slug logoUrl isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ])

  return {
    items: records,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

async function getProductById(vendorId, productId) {
  const pId = validateId(productId, 'Product ID')
  const product = await Product.findOne({ _id: pId, vendor: vendorId })
    .populate('category', 'name slug imageUrl isActive')
    .populate('brand', 'name slug logoUrl isActive')
    .lean()

  if (!product) throw new HttpError(404, 'Product was not found.')
  return product
}

async function createProduct(vendorId, values) {
  const name = typeof values.name === 'string' ? values.name.trim() : ''
  const description = typeof values.description === 'string' ? values.description.trim() : ''
  const price = values.price !== undefined ? Number(values.price) : NaN
  const salePrice = values.salePrice !== undefined && values.salePrice !== null && values.salePrice !== ''
    ? Number(values.salePrice)
    : null
  const stock = values.stock !== undefined ? Number(values.stock) : 0
  const currency = typeof values.currency === 'string' && values.currency.trim()
    ? values.currency.trim().toUpperCase()
    : 'USD'
  const status = typeof values.status === 'string' && values.status.trim()
    ? values.status.trim()
    : 'draft'

  const errors = {}
  if (name.length < 2 || name.length > 160) errors.name = 'Product name must be between 2 and 160 characters.'
  if (description.length > 5000) errors.description = 'Description must be 5000 characters or fewer.'
  if (Number.isNaN(price) || price < 0) errors.price = 'Price must be a valid positive number.'
  if (salePrice !== null) {
    if (Number.isNaN(salePrice) || salePrice < 0) errors.salePrice = 'Sale price must be a valid positive number.'
    else if (!Number.isNaN(price) && salePrice > price) errors.salePrice = 'Sale price cannot exceed regular price.'
  }
  if (!Number.isInteger(stock) || stock < 0) errors.stock = 'Stock must be an integer of 0 or greater.'
  if (!/^[A-Z]{3}$/.test(currency)) errors.currency = 'Currency must be a 3-letter currency code (e.g. USD).'
  if (!['draft', 'active', 'archived'].includes(status)) errors.status = 'Status must be draft, active, or archived.'

  if (!values.category) {
    errors.category = 'A product category is required.'
  } else if (!mongoose.isValidObjectId(values.category)) {
    errors.category = 'Category must be a valid ID.'
  } else {
    const categoryDoc = await Category.findById(values.category)
    if (!categoryDoc) errors.category = 'Selected category does not exist.'
    else if (!categoryDoc.isActive) errors.category = 'Selected category is inactive.'
  }

  let brandId = null
  if (values.brand) {
    if (!mongoose.isValidObjectId(values.brand)) {
      errors.brand = 'Brand must be a valid ID.'
    } else {
      const brandDoc = await Brand.findById(values.brand)
      if (!brandDoc) errors.brand = 'Selected brand does not exist.'
      else if (!brandDoc.isActive) errors.brand = 'Selected brand is inactive.'
      else brandId = brandDoc._id
    }
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields.', errors)

  const slug = await generateUniqueSlug(vendorId, values.slug || name)
  const images = formatImages(values.images)

  const product = await Product.create({
    vendor: vendorId,
    category: values.category,
    brand: brandId,
    name,
    slug,
    description,
    price,
    salePrice,
    stock,
    currency,
    images,
    status,
  })

  return Product.findById(product._id)
    .populate('category', 'name slug imageUrl isActive')
    .populate('brand', 'name slug logoUrl isActive')
    .lean()
}

async function updateProduct(vendorId, productId, values) {
  const pId = validateId(productId, 'Product ID')
  const product = await Product.findOne({ _id: pId, vendor: vendorId })
  if (!product) throw new HttpError(404, 'Product was not found.')

  const errors = {}

  if (values.name !== undefined) {
    const name = typeof values.name === 'string' ? values.name.trim() : ''
    if (name.length < 2 || name.length > 160) errors.name = 'Product name must be between 2 and 160 characters.'
    else product.name = name
  }

  if (values.slug !== undefined) {
    const slug = slugify(values.slug)
    if (!slug) errors.slug = 'Slug must be valid text.'
    else {
      const existing = await Product.findOne({ vendor: vendorId, slug, _id: { $ne: pId } })
      if (existing) errors.slug = 'This slug is already used by another of your products.'
      else product.slug = slug
    }
  }

  if (values.description !== undefined) {
    const desc = typeof values.description === 'string' ? values.description.trim() : ''
    if (desc.length > 5000) errors.description = 'Description must be 5000 characters or fewer.'
    else product.description = desc
  }

  let nextPrice = product.price
  if (values.price !== undefined) {
    const p = Number(values.price)
    if (Number.isNaN(p) || p < 0) errors.price = 'Price must be a valid positive number.'
    else {
      nextPrice = p
      product.price = p
    }
  }

  if (values.salePrice !== undefined) {
    if (values.salePrice === null || values.salePrice === '') {
      product.salePrice = null
    } else {
      const sp = Number(values.salePrice)
      if (Number.isNaN(sp) || sp < 0) errors.salePrice = 'Sale price must be a valid positive number.'
      else if (sp > nextPrice) errors.salePrice = 'Sale price cannot exceed regular price.'
      else product.salePrice = sp
    }
  } else if (values.price !== undefined && product.salePrice !== null && product.salePrice > nextPrice) {
    errors.salePrice = 'Existing sale price exceeds the new regular price.'
  }

  if (values.stock !== undefined) {
    const s = Number(values.stock)
    if (!Number.isInteger(s) || s < 0) errors.stock = 'Stock must be an integer of 0 or greater.'
    else product.stock = s
  }

  if (values.currency !== undefined) {
    const c = typeof values.currency === 'string' ? values.currency.trim().toUpperCase() : ''
    if (!/^[A-Z]{3}$/.test(c)) errors.currency = 'Currency must be a 3-letter currency code (e.g. USD).'
    else product.currency = c
  }

  if (values.status !== undefined) {
    if (!['draft', 'active', 'archived'].includes(values.status)) {
      errors.status = 'Status must be draft, active, or archived.'
    } else {
      product.status = values.status
    }
  }

  if (values.images !== undefined) {
    product.images = formatImages(values.images)
  }

  if (values.category !== undefined) {
    if (!mongoose.isValidObjectId(values.category)) {
      errors.category = 'Category must be a valid ID.'
    } else {
      const categoryDoc = await Category.findById(values.category)
      if (!categoryDoc) errors.category = 'Selected category does not exist.'
      else if (!categoryDoc.isActive) errors.category = 'Selected category is inactive.'
      else product.category = categoryDoc._id
    }
  }

  if (values.brand !== undefined) {
    if (!values.brand) {
      product.brand = null
    } else if (!mongoose.isValidObjectId(values.brand)) {
      errors.brand = 'Brand must be a valid ID.'
    } else {
      const brandDoc = await Brand.findById(values.brand)
      if (!brandDoc) errors.brand = 'Selected brand does not exist.'
      else if (!brandDoc.isActive) errors.brand = 'Selected brand is inactive.'
      else product.brand = brandDoc._id
    }
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields.', errors)

  await product.save()

  return Product.findById(pId)
    .populate('category', 'name slug imageUrl isActive')
    .populate('brand', 'name slug logoUrl isActive')
    .lean()
}

async function deleteProduct(vendorId, productId) {
  const pId = validateId(productId, 'Product ID')
  const product = await Product.findOne({ _id: pId, vendor: vendorId })
  if (!product) throw new HttpError(404, 'Product was not found.')

  await Product.deleteOne({ _id: pId })
  return { message: 'Product deleted successfully.' }
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}
