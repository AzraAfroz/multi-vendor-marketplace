const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')

exports.getCustomerDashboard = async (req, res, next) => {
  try {
    const customerId = req.user._id

    // Fetch customer's orders
    const orders = await Order.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images price')
      .populate('items.vendor', 'storeName')
      .lean()

    // Fetch featured/recommended products
    const recommended = await Product.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('vendor', 'storeName')
      .populate('category', 'name')
      .lean()

    // Calculate customer metrics
    const totalOrders = orders.length
    const deliveredOrders = orders.filter((o) => o.status === 'delivered')
    const loyaltyPoints = 500 + deliveredOrders.length * 40
    const walletBalance = 150

    // Referral code derived from user
    const referralCode = `SHOP${String(customerId).slice(-6).toUpperCase()}`

    const recentOrders = orders.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      totalPrice: o.totalPrice,
      status: o.status,
      itemCount: o.items.length,
      items: o.items.map((i) => ({
        id: String(i._id),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        vendor: i.vendor?.storeName || 'TechNova',
      })),
      shippingAddress: o.shippingAddress,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
    }))

    return res.json({
      user: {
        id: String(req.user._id),
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        memberSince: new Date(req.user.createdAt || Date.now()).getFullYear(),
      },
      metrics: {
        totalOrders,
        walletBalance,
        wishlistItems: 0,
        loyaltyPoints,
      },
      recentOrders,
      wallet: {
        balance: walletBalance,
        transactions: [
          { id: 'tx-1', title: 'Referral signup bonus', amount: 100, type: 'credit', date: 'Recent' },
          { id: 'tx-2', title: 'Welcome bonus', amount: 50, type: 'credit', date: 'Signup' },
        ],
      },
      referral: {
        code: referralCode,
        friendsReferred: 0,
        successful: 0,
        totalEarned: 0,
      },
      recommendedProducts: recommended.map((p) => ({
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        price: p.price,
        salePrice: p.salePrice,
        image: p.images?.[0]?.url || null,
        vendorName: p.vendor?.storeName || 'TechNova',
        categoryName: p.category?.name || 'General',
      })),
    })
  } catch (error) {
    next(error)
  }
}
