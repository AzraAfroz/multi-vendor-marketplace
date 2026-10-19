const express = require('express')
const authenticate = require('../middleware/authenticate')
const requireApprovedVendor = require('../middleware/requireApprovedVendor')
const vendorDashboardController = require('../controllers/vendorDashboardController')

const router = express.Router()

router.use(authenticate, requireApprovedVendor)
router.get('/metrics', vendorDashboardController.getVendorMetrics)
router.patch('/products/:id/stock', vendorDashboardController.updateProductStockQuick)

module.exports = router
