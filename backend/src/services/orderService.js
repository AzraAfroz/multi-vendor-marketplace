const mongoose = require('mongoose')
const Razorpay = require('razorpay')
const Order = require('../models/Order')
const Product = require('../models/Product')
const Vendor = require('../models/Vendor')
const HttpError = require('../utils/HttpError')
const { verifyRazorpaySignature } = require('../utils/paymentVerification')

const MAX_LIMIT = 50

function pagination(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1) throw new HttpError(400, 'page must be a positive integer.')
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new HttpError(400, `limit must be an integer from 1 to ${MAX_LIMIT}.`)
  }
  return { page, limit, skip: (page - 1) * limit }
}

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${timestamp}-${random}`
}

function presentOrder(order) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    customer: order.customer ? {
      id: String(order.customer._id || order.customer),
      name: order.customer.name,
      email: order.customer.email,
    } : null,
    items: order.items.map((item) => ({
      id: String(item._id),
      productId: String(item.product?._id || item.product),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      subtotal: item.subtotal,
      vendorStatus: item.vendorStatus,
      vendor: item.vendor ? {
        id: String(item.vendor?._id || item.vendor),
        name: item.vendor.storeName || item.vendor.name || 'Store',
      } : null,
    })),
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    razorpayOrderId: order.razorpayOrderId || null,
    razorpayPaymentId: order.razorpayPaymentId || null,
    razorpaySignature: order.razorpaySignature || null,
    itemsPrice: order.itemsPrice,
    shippingPrice: order.shippingPrice,
    taxPrice: order.taxPrice,
    totalPrice: order.totalPrice,
    status: order.status,
    paidAt: order.paidAt,
    deliveredAt: order.deliveredAt,
    notes: order.notes,
    cancelReason: order.cancelReason || null,
    cancelledAt: order.cancelledAt || null,
    cancelledBy: order.cancelledBy || null,
    timeline: (order.timeline || []).map((t) => ({
      status: t.status,
      timestamp: t.timestamp,
      note: t.note,
      updatedBy: t.updatedBy,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

async function createOrder(customerId, payload = {}) {
  if (!customerId || !mongoose.isValidObjectId(customerId)) {
    throw new HttpError(401, 'Authentication required to create an order.')
  }

  const {
    items = [],
    shippingAddress = {},
    paymentMethod = 'cod',
    paymentStatus: reqPaymentStatus,
    notes = '',
    razorpayOrderId = null,
    razorpayPaymentId = null,
    razorpaySignature = null,
  } = payload

  // Validate items
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Order must contain at least one item.')
  }

  // Validate shipping address
  const requiredAddressFields = ['fullName', 'phone', 'street', 'city', 'state', 'postalCode']
  const addressErrors = {}
  for (const field of requiredAddressFields) {
    const val = shippingAddress[field]
    if (typeof val !== 'string' || !val.trim()) {
      addressErrors[field] = `${field} is required.`
    }
  }
  if (Object.keys(addressErrors).length > 0) {
    throw new HttpError(400, 'Invalid shipping address.', addressErrors)
  }

  // Validate payment method
  if (!['cod', 'card', 'razorpay'].includes(paymentMethod)) {
    throw new HttpError(400, 'Payment method must be "cod", "card", or "razorpay".')
  }

  // Verify and fetch products
  const productIds = items.map((i) => i.productId)
  for (const pid of productIds) {
    if (!mongoose.isValidObjectId(pid)) {
      throw new HttpError(400, `Invalid product ID: ${pid}`)
    }
  }

  const products = await Product.find({ _id: { $in: productIds } })
    .populate('vendor', 'storeName status')
    .lean()

  const productMap = new Map(products.map((p) => [String(p._id), p]))

  const orderItems = []
  let itemsPrice = 0

  for (const item of items) {
    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError(400, 'Item quantity must be a positive integer.')
    }

    const product = productMap.get(String(item.productId))
    if (!product) {
      throw new HttpError(404, `Product with ID ${item.productId} was not found.`)
    }

    if (product.status !== 'active') {
      throw new HttpError(400, `Product "${product.name}" is no longer available.`)
    }

    if ((product.stock ?? 0) < quantity) {
      throw new HttpError(400, `Insufficient stock for "${product.name}". Only ${product.stock} available.`)
    }

    if (!product.vendor || product.vendor.status !== 'approved') {
      throw new HttpError(400, `Vendor for "${product.name}" is not active.`)
    }

    // Determine authoritative price from database
    const unitPrice =
      product.salePrice !== null && product.salePrice !== undefined && product.salePrice < product.price
        ? product.salePrice
        : product.price

    const subtotal = Math.round(unitPrice * quantity * 100) / 100
    itemsPrice += subtotal

    orderItems.push({
      product: product._id,
      vendor: product.vendor._id,
      name: product.name,
      price: unitPrice,
      quantity,
      image: product.images?.[0]?.url || null,
      subtotal,
      vendorStatus: 'pending',
    })
  }

  itemsPrice = Math.round(itemsPrice * 100) / 100
  const shippingPrice = itemsPrice >= 100 ? 0 : 5 // free shipping over $100
  const taxPrice = 0
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100

  // Determine authoritative payment status before decrementing stock
  let paymentStatus = 'pending'
  let paidAt = null
  let finalRazorpayOrderId = null
  let finalRazorpayPaymentId = null
  let finalRazorpaySignature = null

  if (paymentMethod === 'cod') {
    paymentStatus = 'pending'
    paidAt = null
  } else if (paymentMethod === 'card') {
    // For direct card method (simulated card entry in checkout)
    paymentStatus = reqPaymentStatus === 'failed' ? 'failed' : 'paid'
    paidAt = paymentStatus === 'paid' ? new Date() : null
  } else if (paymentMethod === 'razorpay') {
    if (reqPaymentStatus === 'failed') {
      paymentStatus = 'failed'
      paidAt = null
      finalRazorpayOrderId = razorpayOrderId || null
      finalRazorpayPaymentId = razorpayPaymentId || null
      finalRazorpaySignature = razorpaySignature || null
    } else if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      // Must verify cryptographic signature
      const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim()
      const isSigValid = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        secret
      )
      if (!isSigValid) {
        throw new HttpError(400, 'Invalid payment signature verification failed.')
      }

      // Check payment status from Razorpay API if live client is available
      const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
      if (keyId && secret && !keyId.includes('shopverse123')) {
        try {
          const client = new Razorpay({ key_id: keyId, key_secret: secret })
          const paymentRecord = await client.payments.fetch(razorpayPaymentId)
          if (
            paymentRecord &&
            paymentRecord.status !== 'captured' &&
            paymentRecord.status !== 'authorized'
          ) {
            throw new HttpError(400, `Razorpay payment is in '${paymentRecord.status}' state, not captured.`)
          }
        } catch (apiErr) {
          if (apiErr instanceof HttpError) throw apiErr
          // In offline / test environment where mock secret is used, proceed if signature is valid
        }
      }

      paymentStatus = 'paid'
      paidAt = new Date()
      finalRazorpayOrderId = razorpayOrderId
      finalRazorpayPaymentId = razorpayPaymentId
      finalRazorpaySignature = razorpaySignature
    } else {
      // Unpaid or pending Razorpay order
      paymentStatus = 'pending'
      paidAt = null
      finalRazorpayOrderId = razorpayOrderId || null
      finalRazorpayPaymentId = null
      finalRazorpaySignature = null
    }
  }

  // Decrement stock atomically for each product with rollback on insufficient stock (only if not failed)
  const decrementedItems = []
  if (paymentStatus !== 'failed') {
    for (const item of orderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: 'after' }
      )
      if (!updated) {
        for (const prev of decrementedItems) {
          await Product.findByIdAndUpdate(prev.product, { $inc: { stock: prev.quantity } })
        }
        throw new HttpError(400, `Insufficient stock for "${item.name}". Another order just purchased this item.`)
      }
      decrementedItems.push(item)
    }
  }

  // Generate unique order number
  let orderNumber = generateOrderNumber()
  let attempts = 0
  while ((await Order.exists({ orderNumber })) && attempts < 5) {
    orderNumber = generateOrderNumber()
    attempts++
  }

  const order = new Order({
    orderNumber,
    customer: customerId,
    items: orderItems,
    shippingAddress: {
      fullName: shippingAddress.fullName.trim(),
      phone: shippingAddress.phone.trim(),
      street: shippingAddress.street.trim(),
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      postalCode: shippingAddress.postalCode.trim(),
      country: (shippingAddress.country || 'US').trim(),
    },
    paymentMethod,
    paymentStatus,
    razorpayOrderId: finalRazorpayOrderId,
    razorpayPaymentId: finalRazorpayPaymentId,
    razorpaySignature: finalRazorpaySignature,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    status: 'pending',
    paidAt,
    notes: typeof notes === 'string' ? notes.trim() : '',
    timeline: [
      {
        status: 'pending',
        timestamp: new Date(),
        note:
          paymentStatus === 'paid'
            ? `Order placed and payment verified via ${paymentMethod === 'razorpay' ? `Razorpay (${finalRazorpayPaymentId})` : paymentMethod}`
            : paymentStatus === 'failed'
            ? 'Order placed with payment failed'
            : `Order placed with payment pending via ${paymentMethod}`,
        updatedBy: 'customer',
      },
    ],
  })

  await order.save()

  // Return populated order
  const saved = await Order.findById(order._id)
    .populate('customer', 'name email')
    .populate('items.vendor', 'storeName')
    .lean()

  return presentOrder(saved)
}

async function getCustomerOrders(customerId, query = {}) {
  const { page, limit, skip } = pagination(query)
  const filter = { customer: customerId }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('items.vendor', 'storeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ])

  return {
    items: orders.map(presentOrder),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

async function getCustomerOrderById(customerId, orderId) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new HttpError(400, 'Order ID must be a valid ID.')
  }

  const order = await Order.findOne({ _id: orderId, customer: customerId })
    .populate('customer', 'name email')
    .populate('items.vendor', 'storeName')
    .lean()

  if (!order) {
    throw new HttpError(404, 'Order was not found.')
  }

  return presentOrder(order)
}

async function cancelCustomerOrder(customerId, orderId, payload = {}) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new HttpError(400, 'Order ID must be a valid ID.')
  }

  const order = await Order.findOne({ _id: orderId, customer: customerId })
  if (!order) {
    throw new HttpError(404, 'Order was not found.')
  }

  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    throw new HttpError(
      400,
      `Cannot cancel order with status "${order.status}". Orders can only be cancelled before dispatch.`
    )
  }

  const reason = (payload.reason || '').trim() || 'Cancelled by customer'

  order.status = 'cancelled'
  order.cancelReason = reason
  order.cancelledAt = new Date()
  order.cancelledBy = 'customer'

  // Restore stock atomically for each uncancelled item
  for (const item of order.items) {
    if (item.vendorStatus !== 'cancelled') {
      item.vendorStatus = 'cancelled'
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
    }
  }

  order.timeline.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: reason,
    updatedBy: 'customer',
  })

  await order.save()

  const updated = await Order.findById(order._id)
    .populate('customer', 'name email')
    .populate('items.vendor', 'storeName')
    .lean()

  return presentOrder(updated)
}

async function getVendorOrders(vendorId, query = {}) {
  const { page, limit, skip } = pagination(query)
  const filter = { 'items.vendor': vendorId }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'name email')
      .populate('items.vendor', 'storeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ])

  // Filter items in each order to vendor-specific view
  const formatted = orders.map((order) => {
    const presented = presentOrder(order)
    // Filter to only this vendor's items
    const vendorItems = presented.items.filter((i) => i.vendor?.id === String(vendorId))
    const vendorTotal = vendorItems.reduce((acc, i) => acc + i.subtotal, 0)
    return {
      ...presented,
      vendorItems,
      vendorSubtotal: Math.round(vendorTotal * 100) / 100,
    }
  })

  return {
    items: formatted,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

async function updateVendorOrderStatus(vendorId, orderId, vendorStatus) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new HttpError(400, 'Order ID must be a valid ID.')
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(vendorStatus)) {
    throw new HttpError(400, `Status must be one of: ${validStatuses.join(', ')}`)
  }

  const order = await Order.findOne({ _id: orderId, 'items.vendor': vendorId })
  if (!order) {
    throw new HttpError(404, 'Order was not found or does not contain your items.')
  }

  // If vendor cancels their items, restore product stock
  if (vendorStatus === 'cancelled') {
    for (const item of order.items) {
      if (String(item.vendor) === String(vendorId) && item.vendorStatus !== 'cancelled') {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
      }
    }
  }

  // Update status for this vendor's items
  for (const item of order.items) {
    if (String(item.vendor) === String(vendorId)) {
      item.vendorStatus = vendorStatus
    }
  }

  // Update overall order status if appropriate
  const allDelivered = order.items.every((i) => i.vendorStatus === 'delivered')
  const allCancelled = order.items.every((i) => i.vendorStatus === 'cancelled')
  const anyShipped = order.items.some((i) => ['shipped', 'delivered'].includes(i.vendorStatus))

  if (allDelivered) {
    order.status = 'delivered'
    order.deliveredAt = new Date()
  } else if (allCancelled) {
    order.status = 'cancelled'
    order.cancelledAt = new Date()
    order.cancelledBy = 'vendor'
    order.cancelReason = 'Items cancelled by vendor'
  } else if (anyShipped) {
    order.status = 'shipped'
  } else if (vendorStatus === 'processing') {
    order.status = 'processing'
  }

  order.timeline.push({
    status: order.status,
    timestamp: new Date(),
    note: `Vendor updated items to ${vendorStatus}`,
    updatedBy: 'vendor',
  })

  await order.save()

  const updated = await Order.findById(order._id)
    .populate('customer', 'name email')
    .populate('items.vendor', 'storeName')
    .lean()

  return presentOrder(updated)
}

async function listAdminOrders(query = {}) {
  const { page, limit, skip } = pagination(query)
  const filter = {}
  if (query.status && ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(query.status)) {
    filter.status = query.status
  }
  if (query.paymentStatus && ['pending', 'paid', 'failed'].includes(query.paymentStatus)) {
    filter.paymentStatus = query.paymentStatus
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'name email')
      .populate('items.vendor', 'storeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ])

  return {
    items: orders.map(presentOrder),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

async function updateAdminOrderStatus(orderId, payload = {}) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new HttpError(400, 'Order ID must be a valid ID.')
  }

  const order = await Order.findById(orderId)
  if (!order) {
    throw new HttpError(404, 'Order was not found.')
  }

  const { status, paymentStatus } = payload
  if (status) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      throw new HttpError(400, `Status must be one of: ${validStatuses.join(', ')}`)
    }

    if (status === 'cancelled' && order.status !== 'cancelled') {
      // restore stock for all active items
      for (const item of order.items) {
        if (item.vendorStatus !== 'cancelled') {
          item.vendorStatus = 'cancelled'
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
        }
      }
      order.cancelledAt = new Date()
      order.cancelledBy = 'admin'
      order.cancelReason = payload.cancelReason || 'Cancelled by administrator'
    } else if (status === 'delivered') {
      order.deliveredAt = new Date()
    }

    order.status = status
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: payload.note || `Administrator updated status to ${status}`,
      updatedBy: 'admin',
    })
  }

  if (paymentStatus) {
    const validPaymentStatuses = ['pending', 'paid', 'failed']
    if (!validPaymentStatuses.includes(paymentStatus)) {
      throw new HttpError(400, `paymentStatus must be one of: ${validPaymentStatuses.join(', ')}`)
    }
    order.paymentStatus = paymentStatus
    if (paymentStatus === 'paid' && !order.paidAt) order.paidAt = new Date()
  }

  await order.save()

  const updated = await Order.findById(order._id)
    .populate('customer', 'name email')
    .populate('items.vendor', 'storeName')
    .lean()

  return presentOrder(updated)
}

async function validateCart(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      valid: false,
      items: [],
      itemsPrice: 0,
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice: 0,
      errors: ['Cart is empty.'],
    }
  }

  const validIds = items
    .map((i) => i.productId)
    .filter((id) => id && mongoose.isValidObjectId(id))

  const products = await Product.find({ _id: { $in: validIds } })
    .populate('vendor', 'storeName status')
    .lean()

  const productMap = new Map(products.map((p) => [String(p._id), p]))
  const validatedItems = []
  const errors = []
  let itemsPrice = 0

  for (const item of items) {
    const qty = Number(item.quantity)
    const pid = String(item.productId || '')
    const product = productMap.get(pid)

    if (!Number.isInteger(qty) || qty < 1) {
      errors.push(`Invalid quantity for item ${pid}.`)
      continue
    }

    if (!product) {
      const msg = `Product with ID ${pid} was not found.`
      errors.push(msg)
      validatedItems.push({
        productId: pid,
        name: item.name || 'Unavailable Item',
        quantity: qty,
        price: 0,
        subtotal: 0,
        available: false,
        error: msg,
      })
      continue
    }

    if (product.status !== 'active') {
      const msg = `"${product.name}" is no longer available.`
      errors.push(msg)
      validatedItems.push({
        productId: pid,
        name: product.name,
        quantity: qty,
        price: product.price,
        subtotal: 0,
        available: false,
        error: msg,
      })
      continue
    }

    if (!product.vendor || product.vendor.status !== 'approved') {
      const msg = `Vendor for "${product.name}" is not active.`
      errors.push(msg)
      validatedItems.push({
        productId: pid,
        name: product.name,
        quantity: qty,
        price: product.price,
        subtotal: 0,
        available: false,
        error: msg,
      })
      continue
    }

    const availableStock = product.stock ?? 0
    const hasEnoughStock = availableStock >= qty
    let stockError = null
    if (!hasEnoughStock) {
      if (availableStock <= 0) {
        stockError = `"${product.name}" is out of stock.`
      } else {
        stockError = `Insufficient stock for "${product.name}". Only ${availableStock} available.`
      }
      errors.push(stockError)
    }

    const unitPrice =
      product.salePrice !== null && product.salePrice !== undefined && product.salePrice < product.price
        ? product.salePrice
        : product.price

    const subtotal = Math.round(unitPrice * qty * 100) / 100
    if (hasEnoughStock) {
      itemsPrice += subtotal
    }

    validatedItems.push({
      productId: pid,
      name: product.name,
      price: unitPrice,
      regularPrice: product.price,
      salePrice: product.salePrice,
      quantity: qty,
      availableStock,
      inStock: availableStock > 0,
      hasEnoughStock,
      available: true,
      subtotal,
      store: {
        id: String(product.vendor._id),
        name: product.vendor.storeName || 'Store',
      },
      image: product.images?.[0]?.url || null,
      error: stockError,
    })
  }

  itemsPrice = Math.round(itemsPrice * 100) / 100
  const shippingPrice = itemsPrice >= 100 || itemsPrice === 0 ? 0 : 5
  const taxPrice = 0
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100

  return {
    valid: errors.length === 0,
    items: validatedItems,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    errors,
  }
}

async function confirmOrderPayment(customerId, orderId, payload = {}) {
  if (!customerId || !mongoose.isValidObjectId(customerId)) {
    throw new HttpError(401, 'Authentication required to confirm payment.')
  }
  if (!orderId || !mongoose.isValidObjectId(orderId)) {
    throw new HttpError(400, 'Invalid order ID.')
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new HttpError(400, 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.')
  }

  const order = await Order.findById(orderId)
  if (!order) {
    throw new HttpError(404, 'Order not found.')
  }

  if (String(order.customer) !== String(customerId)) {
    throw new HttpError(403, 'You do not have permission to confirm payment for this order.')
  }

  if (order.paymentStatus === 'paid') {
    const populated = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items.vendor', 'storeName')
      .lean()
    return presentOrder(populated)
  }

  const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim()
  const isSigValid = verifyRazorpaySignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    secret
  )

  if (!isSigValid) {
    order.paymentStatus = 'failed'
    order.timeline.push({
      status: order.status,
      timestamp: new Date(),
      note: 'Razorpay payment signature verification failed.',
      updatedBy: 'system',
    })
    await order.save()
    throw new HttpError(400, 'Invalid payment signature verification failed.')
  }

  // Check actual status from Razorpay API if live client is available
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
  if (keyId && secret && !keyId.includes('shopverse123')) {
    try {
      const client = new Razorpay({ key_id: keyId, key_secret: secret })
      const paymentRecord = await client.payments.fetch(razorpayPaymentId)
      if (
        paymentRecord &&
        paymentRecord.status !== 'captured' &&
        paymentRecord.status !== 'authorized'
      ) {
        order.paymentStatus = 'failed'
        await order.save()
        throw new HttpError(400, `Razorpay payment is in '${paymentRecord.status}' state, not captured.`)
      }
    } catch (apiErr) {
      if (apiErr instanceof HttpError) throw apiErr
    }
  }

  order.paymentStatus = 'paid'
  order.paidAt = new Date()
  order.razorpayOrderId = razorpayOrderId
  order.razorpayPaymentId = razorpayPaymentId
  order.razorpaySignature = razorpaySignature
  order.timeline.push({
    status: order.status,
    timestamp: new Date(),
    note: `Razorpay payment ${razorpayPaymentId} verified successfully.`,
    updatedBy: 'system',
  })

  await order.save()

  const saved = await Order.findById(order._id)
    .populate('customer', 'name email')
    .populate('items.vendor', 'storeName')
    .lean()

  return presentOrder(saved)
}

module.exports = {
  createOrder,
  confirmOrderPayment,
  validateCart,
  getCustomerOrders,
  getCustomerOrderById,
  cancelCustomerOrder,
  getVendorOrders,
  updateVendorOrderStatus,
  listAdminOrders,
  updateAdminOrderStatus,
}
