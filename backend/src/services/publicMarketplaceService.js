const mongoose = require('mongoose')
const Brand = require('../models/Brand')
const Category = require('../models/Category')
const Product = require('../models/Product')
const Vendor = require('../models/Vendor')
const HttpError = require('../utils/HttpError')

const MAX_LIMIT = 50

function pagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1) throw new HttpError(400, 'page must be a positive integer.')
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw new HttpError(400, `limit must be an integer from 1 to ${MAX_LIMIT}.`)
  return { page, limit, skip: (page - 1) * limit }
}

function optionalId(value, name) {
  if (value === undefined) return undefined
  if (!mongoose.isValidObjectId(value)) throw new HttpError(400, `${name} must be a valid ID.`)
  return new mongoose.Types.ObjectId(value)
}

function searchPattern(value) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.trim().length > 100) throw new HttpError(400, 'q must be text with at most 100 characters.')
  const escaped = value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return escaped ? new RegExp(escaped, 'i') : undefined
}

function pageResult(items, total, page, limit) {
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

function presentCategory(category) {
  return {
    id: String(category._id), name: category.name, slug: category.slug,
    description: category.description, imageUrl: category.imageUrl,
    parent: category.parent ? { id: String(category.parent._id), name: category.parent.name, slug: category.parent.slug } : null,
  }
}

function presentBrand(brand) {
  return { id: String(brand._id), name: brand.name, slug: brand.slug, description: brand.description, logoUrl: brand.logoUrl }
}

function presentStore(store) {
  return {
    id: String(store._id),
    name: store.storeName,
    description: store.description,
    createdAt: store.createdAt || null,
  }
}

function presentProduct(product) {
  return {
    id: String(product._id), name: product.name, slug: product.slug,
    description: product.description, price: product.price,
    salePrice: product.salePrice ?? null, stock: product.stock ?? 0,
    currency: product.currency, images: product.images,
    rating: product.rating ?? 0,
    numReviews: product.numReviews ?? 0,
    category: product.category ? presentCategory(product.category) : null,
    brand: product.brand ? presentBrand(product.brand) : null,
    store: product.vendor ? presentStore(product.vendor) : null,
    createdAt: product.createdAt,
  }
}

async function listCategories(query) {
  const { page, limit, skip } = pagination(query)
  const filter = { isActive: true }
  const [records, total] = await Promise.all([
    Category.find(filter).select('name slug description imageUrl parent').populate({ path: 'parent', match: { isActive: true }, select: 'name slug' }).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter),
  ])
  return pageResult(records.map(presentCategory), total, page, limit)
}

async function listBrands(query) {
  const { page, limit, skip } = pagination(query)
  const filter = { isActive: true }
  const [records, total] = await Promise.all([
    Brand.find(filter).select('name slug description logoUrl').sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Brand.countDocuments(filter),
  ])
  return pageResult(records.map(presentBrand), total, page, limit)
}

async function listStores(query) {
  const { page, limit, skip } = pagination(query)
  const filter = { status: 'approved', isPublic: { $ne: false } }
  const search = searchPattern(query.q)
  if (search) filter.$or = [{ storeName: search }, { description: search }]
  const [records, total] = await Promise.all([
    Vendor.find(filter).select('storeName description').sort({ storeName: 1 }).skip(skip).limit(limit).lean(),
    Vendor.countDocuments(filter),
  ])
  return pageResult(records.map(presentStore), total, page, limit)
}

async function resolveCategoryId(value) {
  if (value === undefined || value === null || value === '') return undefined
  if (mongoose.isValidObjectId(value)) return new mongoose.Types.ObjectId(value)
  const cat = await Category.findOne({ slug: String(value).trim(), isActive: true })
  if (cat) return cat._id
  throw new HttpError(400, 'category must be a valid ID.')
}

async function resolveBrandId(value) {
  if (value === undefined || value === null || value === '') return undefined
  if (mongoose.isValidObjectId(value)) return new mongoose.Types.ObjectId(value)
  const brand = await Brand.findOne({ slug: String(value).trim(), isActive: true })
  if (brand) return brand._id
  throw new HttpError(400, 'brand must be a valid ID.')
}

async function resolveVendorId(value) {
  if (value === undefined || value === null || value === '') return undefined
  if (mongoose.isValidObjectId(value)) return new mongoose.Types.ObjectId(value)
  const vendor = await Vendor.findOne({
    $or: [{ slug: String(value).trim() }, { storeName: new RegExp(`^${String(value).trim()}$`, 'i') }],
    status: 'approved',
  })
  if (vendor) return vendor._id
  throw new HttpError(400, 'store must be a valid ID.')
}

async function listProducts(query) {
  const { page, limit, skip } = pagination(query)
  const [categoryId, brandId, vendorId] = await Promise.all([
    resolveCategoryId(query.category),
    resolveBrandId(query.brand),
    resolveVendorId(query.store),
  ])
  const search = searchPattern(query.q)
  const sortName = query.sort || 'newest'
  const sorts = {
    newest: { createdAt: -1, _id: -1 },
    popular: { createdAt: -1, _id: -1 },
    best_sellers: { createdAt: -1, _id: -1 },
    top_rated: { rating: -1, numReviews: -1, createdAt: -1, _id: -1 },
    price_asc: { price: 1, _id: 1 },
    price_desc: { price: -1, _id: -1 },
    name: { name: 1, _id: 1 },
  }
  if (!Object.hasOwn(sorts, sortName)) throw new HttpError(400, 'sort must be newest, popular, best_sellers, top_rated, price_asc, price_desc, or name.')

  const [vendorIds, categoryIds, brandIds] = await Promise.all([
    Vendor.distinct('_id', { status: 'approved', isPublic: { $ne: false } }),
    Category.distinct('_id', { isActive: true }),
    Brand.distinct('_id', { isActive: true }),
  ])
  const filter = { status: 'active', vendor: { $in: vendorIds }, category: { $in: categoryIds } }
  if (vendorId) filter.vendor = { $in: vendorIds, $eq: vendorId }
  if (categoryId) filter.category = { $in: categoryIds, $eq: categoryId }
  if (brandId) filter.brand = { $in: brandIds, $eq: brandId }
  else filter.$or = [{ brand: null }, { brand: { $in: brandIds } }]
  if (search) filter.$and = [...(filter.$and || []), { $or: [{ name: search }, { description: search }] }]

  const [records, total] = await Promise.all([
    Product.find(filter)
      .select('name slug description price salePrice stock currency images category brand vendor rating numReviews createdAt')
      .populate({ path: 'category', match: { isActive: true }, select: 'name slug description imageUrl parent', populate: { path: 'parent', match: { isActive: true }, select: 'name slug' } })
      .populate({ path: 'brand', match: { isActive: true }, select: 'name slug description logoUrl' })
      .populate({ path: 'vendor', match: { status: 'approved', isPublic: { $ne: false } }, select: 'storeName description' })
      .sort(sorts[sortName]).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ])
  const visible = records.filter((record) => record.category && record.vendor && (!record.brand || brandIds.some((id) => String(id) === String(record.brand._id))))
  return pageResult(visible.map(presentProduct), total, page, limit)
}

async function getProductById(id) {
  if (!id) throw new HttpError(400, 'Product ID is required.')
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Product ID must be a valid ID.')

  const [vendorIds, categoryIds, brandIds] = await Promise.all([
    Vendor.distinct('_id', { status: 'approved', isPublic: { $ne: false } }),
    Category.distinct('_id', { isActive: true }),
    Brand.distinct('_id', { isActive: true }),
  ])

  const filter = {
    _id: id,
    status: 'active',
    vendor: { $in: vendorIds },
    category: { $in: categoryIds },
    $or: [{ brand: null }, { brand: { $in: brandIds } }],
  }

  const product = await Product.findOne(filter)
    .select('name slug description price salePrice stock currency images category brand vendor rating numReviews createdAt')
    .populate({ path: 'category', match: { isActive: true }, select: 'name slug description imageUrl parent', populate: { path: 'parent', match: { isActive: true }, select: 'name slug' } })
    .populate({ path: 'brand', match: { isActive: true }, select: 'name slug description logoUrl' })
    .populate({ path: 'vendor', match: { status: 'approved', isPublic: { $ne: false } }, select: 'storeName description' })
    .lean()

  if (!product || !product.category || !product.vendor || (product.brand && !brandIds.some((bId) => String(bId) === String(product.brand._id)))) {
    throw new HttpError(404, 'Product was not found.')
  }

  return presentProduct(product)
}

async function getStoreById(id) {
  if (!id) throw new HttpError(400, 'Store ID is required.')
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Store ID must be a valid ID.')

  const vendor = await Vendor.findOne({ _id: id, status: 'approved', isPublic: { $ne: false } })
    .select('storeName description createdAt')
    .lean()

  if (!vendor) {
    throw new HttpError(404, 'Store was not found.')
  }

  return presentStore(vendor)
}

module.exports = { listCategories, listBrands, listStores, getStoreById, listProducts, getProductById }
