const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  imageUrl: { type: String, trim: true, default: '' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

categorySchema.index({ isActive: 1, sortOrder: 1, name: 1 })

module.exports = mongoose.model('Category', categorySchema)
