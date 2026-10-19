const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: null },
  subtotal: { type: Number, required: true, min: 0 },
  vendorStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
}, { _id: true })

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: 'US' },
}, { _id: false })

const orderTimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  updatedBy: { type: String, enum: ['customer', 'vendor', 'admin', 'system'], default: 'system' },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { type: shippingAddressSchema, required: true },
  paymentMethod: { type: String, enum: ['cod', 'card', 'razorpay'], required: true, default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
  itemsPrice: { type: Number, required: true, min: 0 },
  shippingPrice: { type: Number, default: 0, min: 0 },
  taxPrice: { type: Number, default: 0, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  paidAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  notes: { type: String, default: '', trim: true },
  cancelReason: { type: String, default: null, trim: true },
  cancelledAt: { type: Date, default: null },
  cancelledBy: { type: String, enum: ['customer', 'vendor', 'admin', null], default: null },
  timeline: { type: [orderTimelineSchema], default: [] },
}, { timestamps: true })

orderSchema.index({ customer: 1, createdAt: -1 })
orderSchema.index({ 'items.vendor': 1, createdAt: -1 })

module.exports = mongoose.model('Order', orderSchema)
