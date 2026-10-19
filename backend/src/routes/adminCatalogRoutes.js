const express = require('express')
const authenticate = require('../middleware/authenticate')
const requireAdmin = require('../middleware/requireAdmin')
const controller = require('../controllers/adminCatalogController')

const router = express.Router()

router.use(authenticate, requireAdmin)

// Categories
router.get('/categories', controller.listCategories)
router.post('/categories', controller.createCategory)
router.get('/categories/:id', controller.getCategory)
router.patch('/categories/:id', controller.updateCategory)
router.delete('/categories/:id', controller.deleteCategory)

// Brands
router.get('/brands', controller.listBrands)
router.post('/brands', controller.createBrand)
router.get('/brands/:id', controller.getBrand)
router.patch('/brands/:id', controller.updateBrand)
router.delete('/brands/:id', controller.deleteBrand)

module.exports = router
