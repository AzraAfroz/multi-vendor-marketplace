const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    password: { type: String, select: false },
    role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },
    googleId: {
      type: String,
      index: { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } },
    },
    avatar: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    resetPasswordOtp: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
