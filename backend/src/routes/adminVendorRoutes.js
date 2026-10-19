const express = require('express')
const authenticate = require('../middleware/authenticate')
const requireAdmin = require('../middleware/requireAdmin')
const { listVendors, reviewVendor, getKycDocument } = require('../controllers/adminVendorController')

const router = express.Router()
router.use(authenticate, requireAdmin)
router.get('/vendors', listVendors)
router.get('/vendors/:vendorId/kyc', getKycDocument)
router.patch('/vendors/:vendorId/review', reviewVendor)

module.exports = router
