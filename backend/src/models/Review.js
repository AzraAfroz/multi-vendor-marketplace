const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 3000 },
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

reviewSchema.index({ product: 1, user: 1 }, { unique: true })
reviewSchema.index({ product: 1, createdAt: -1 })

module.exports = mongoose.model('Review', reviewSchema)
