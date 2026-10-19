const express = require('express')
const controller = require('../controllers/publicMarketplaceController')

const router = express.Router()
router.get('/categories', controller.listCategories)
router.get('/brands', controller.listBrands)
router.get('/stores', controller.listStores)
router.get('/stores/:id', controller.getStoreById)
router.get('/products', controller.listProducts)
router.get('/products/:id', controller.getProductById)

module.exports = router
