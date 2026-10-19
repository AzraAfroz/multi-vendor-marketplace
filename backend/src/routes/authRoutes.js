const express = require('express')
const {
  register,
  login,
  googleAuth,
  me,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController')
const authenticate = require('../middleware/authenticate')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/google', googleAuth)
router.get('/me', authenticate, me)
router.post('/logout', authenticate, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

module.exports = router
