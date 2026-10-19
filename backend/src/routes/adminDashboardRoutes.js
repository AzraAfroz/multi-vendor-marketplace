const express = require('express')
const authenticate = require('../middleware/authenticate')
const requireAdmin = require('../middleware/requireAdmin')
const adminDashboardController = require('../controllers/adminDashboardController')

const router = express.Router()

router.use(authenticate, requireAdmin)
router.get('/metrics', adminDashboardController.getAdminMetrics)

module.exports = router
