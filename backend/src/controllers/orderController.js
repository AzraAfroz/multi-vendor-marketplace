const orderService = require('../services/orderService')
const { sendOrderConfirmationEmail } = require('../services/emailService')

async function createOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.user.id, req.body)

    // Send confirmation email via Nodemailer asynchronously
    if (req.user?.email) {
      sendOrderConfirmationEmail({
        to: req.user.email,
        name: req.user.name,
        order: {
          id: order.orderNumber || order.id,
          items: order.items,
          totalAmount: order.totalPrice,
          shippingAddress: order.shippingAddress,
        },
      }).catch((err) => console.warn('[OrderEmail] Confirmation email warning:', err.message))
    }

    return res.status(201).json({ message: 'Order created successfully.', order })
  } catch (error) {
    return next(error)
  }
}

async function getMyOrders(req, res, next) {
  try {
    const result = await orderService.getCustomerOrders(req.user.id, req.query)
    return res.json({ orders: result })
  } catch (error) {
    return next(error)
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getCustomerOrderById(req.user.id, req.params.id)
    return res.json({ order })
  } catch (error) {
    return next(error)
  }
}

async function validateCart(req, res, next) {
  try {
    const result = await orderService.validateCart(req.body.items)
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

async function cancelOrder(req, res, next) {
  try {
    const order = await orderService.cancelCustomerOrder(req.user.id, req.params.id, req.body)
    return res.json({ message: 'Order cancelled successfully and stock restored.', order })
  } catch (error) {
    return next(error)
  }
}

async function confirmPayment(req, res, next) {
  try {
    const order = await orderService.confirmOrderPayment(req.user.id, req.params.id, req.body)
    return res.json({ message: 'Payment confirmed and verified successfully.', order })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createOrder,
  confirmPayment,
  validateCart,
  getMyOrders,
  getOrderById,
  cancelOrder,
}

