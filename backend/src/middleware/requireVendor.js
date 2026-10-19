function requireVendor(req, res, next) {
  if (req.user.role !== 'vendor') return res.status(403).json({ message: 'A vendor account is required to access this resource.' })
  return next()
}

module.exports = requireVendor
