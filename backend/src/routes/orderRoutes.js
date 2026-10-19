const express = require('express')
const authenticate = require('../middleware/authenticate')
const orderController = require('../controllers/orderController')

const router = express.Router()

router.post('/validate-cart', orderController.validateCart)

router.use(authenticate)

router.post('/', orderController.createOrder)
router.get('/my-orders', orderController.getMyOrders)
router.get('/:id', orderController.getOrderById)
router.post('/:id/confirm-payment', orderController.confirmPayment)
router.patch('/:id/cancel', orderController.cancelOrder)

module.exports = router
