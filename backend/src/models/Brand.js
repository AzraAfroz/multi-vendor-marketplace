const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  logoUrl: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

brandSchema.index({ isActive: 1, name: 1 })

module.exports = mongoose.model('Brand', brandSchema)
