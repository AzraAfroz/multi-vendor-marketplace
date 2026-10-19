const mongoose = require('mongoose')

const vendorSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  storeName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
  isPublic: { type: Boolean, default: true },
  kycDocument: {
    storageKey: { type: String, default: null },
    mimeType: { type: String, enum: ['application/pdf', 'image/jpeg', 'image/png'], default: null },
    uploadedAt: { type: Date, default: null },
  },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

module.exports = mongoose.model('Vendor', vendorSchema)
