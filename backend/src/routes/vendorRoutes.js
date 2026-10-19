const express = require('express')
const authenticate = require('../middleware/authenticate')
const requireVendor = require('../middleware/requireVendor')
const uploadKyc = require('../middleware/uploadKyc')
const { getMyStore, createMyStore, submitKyc } = require('../controllers/vendorController')

const router = express.Router()
router.use(authenticate)
router.get('/me', getMyStore)
router.post('/onboarding', createMyStore)
router.post('/kyc', uploadKyc, submitKyc)
router.get('/store', requireVendor, getMyStore)

module.exports = router
