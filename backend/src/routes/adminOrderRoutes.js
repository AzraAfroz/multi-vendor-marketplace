const express = require('express')
const authenticate = require('../middleware/authenticate')
const requireAdmin = require('../middleware/requireAdmin')
const adminOrderController = require('../controllers/adminOrderController')

const router = express.Router()

router.use(authenticate, requireAdmin)

router.get('/', adminOrderController.listAdminOrders)
router.patch('/:id/status', adminOrderController.updateAdminOrderStatus)

module.exports = router
