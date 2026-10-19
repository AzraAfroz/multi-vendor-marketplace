const express = require('express')
const authenticate = require('../middleware/authenticate')
const customerDashboardController = require('../controllers/customerDashboardController')

const router = express.Router()

router.use(authenticate)
router.get('/dashboard', customerDashboardController.getCustomerDashboard)

module.exports = router
