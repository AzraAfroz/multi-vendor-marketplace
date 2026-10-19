const express = require('express')
const authenticate = require('../middleware/authenticate')
const requireApprovedVendor = require('../middleware/requireApprovedVendor')
const vendorOrderController = require('../controllers/vendorOrderController')

const router = express.Router()

router.use(authenticate, requireApprovedVendor)

router.get('/', vendorOrderController.getVendorOrders)
router.patch('/:id/status', vendorOrderController.updateVendorOrderStatus)

module.exports = router
