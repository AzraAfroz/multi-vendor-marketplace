const express = require('express')
const authenticate = require('../middleware/authenticate')
const requireApprovedVendor = require('../middleware/requireApprovedVendor')
const uploadProductImage = require('../middleware/uploadProductImage')
const controller = require('../controllers/vendorProductController')

const router = express.Router()

router.use(authenticate, requireApprovedVendor)

router.get('/', controller.listProducts)
router.post('/', controller.createProduct)
router.post('/upload-image', uploadProductImage, controller.uploadImage)
router.get('/:id', controller.getProduct)
router.patch('/:id', controller.updateProduct)
router.delete('/:id', controller.deleteProduct)

module.exports = router
