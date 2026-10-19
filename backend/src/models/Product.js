const mongoose = require('mongoose')

const productImageSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  alt: { type: String, trim: true, maxlength: 160, default: '' },
}, { _id: false })

const productSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
  description: { type: String, trim: true, maxlength: 5000, default: '' },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0, default: null },
  stock: { type: Number, min: 0, default: 0 },
  currency: { type: String, required: true, trim: true, uppercase: true, minlength: 3, maxlength: 3, default: 'INR' },
  images: { type: [productImageSchema], default: [] },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', index: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0, min: 0 },
}, { timestamps: true })

productSchema.index({ vendor: 1, slug: 1 }, { unique: true })
productSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('Product', productSchema)
