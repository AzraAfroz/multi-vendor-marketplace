const orderService = require('../services/orderService')

async function getVendorOrders(req, res, next) {
  try {
    const result = await orderService.getVendorOrders(req.vendor.id, req.query)
    return res.json({ orders: result })
  } catch (error) {
    return next(error)
  }
}

async function updateVendorOrderStatus(req, res, next) {
  try {
    const { status } = req.body
    const order = await orderService.updateVendorOrderStatus(req.vendor.id, req.params.id, status)
    return res.json({ message: 'Order status updated successfully.', order })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getVendorOrders,
  updateVendorOrderStatus,
}
