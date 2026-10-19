const orderService = require('../services/orderService')

async function listAdminOrders(req, res, next) {
  try {
    const result = await orderService.listAdminOrders(req.query)
    return res.json({ orders: result })
  } catch (error) {
    return next(error)
  }
}

async function updateAdminOrderStatus(req, res, next) {
  try {
    const order = await orderService.updateAdminOrderStatus(req.params.id, req.body)
    return res.json({ message: 'Order updated successfully.', order })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  listAdminOrders,
  updateAdminOrderStatus,
}
