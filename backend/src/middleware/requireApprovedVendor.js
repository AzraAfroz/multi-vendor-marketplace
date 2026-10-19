const Vendor = require('../models/Vendor')

async function requireApprovedVendor(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'A vendor account is required to access this resource.' })
    }
    const vendor = await Vendor.findOne({ owner: req.user._id })
    if (!vendor) {
      return res.status(404).json({ message: 'No store profile was found for this account.' })
    }
    if (vendor.status !== 'approved') {
      return res.status(403).json({ message: 'Your store must be approved by an administrator before managing products.' })
    }
    req.vendor = vendor
    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = requireApprovedVendor
