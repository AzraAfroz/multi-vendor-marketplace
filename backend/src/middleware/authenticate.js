const jwt = require('jsonwebtoken')
const User = require('../models/User')

async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Authentication required.' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    const user = await User.findById(payload.sub).select('name email phone role')
    if (!user) return res.status(401).json({ message: 'This session is no longer valid.' })
    req.user = user
    req.token = token
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Your session is invalid or expired. Please sign in again.' })
    next(error)
  }
}

module.exports = authenticate
