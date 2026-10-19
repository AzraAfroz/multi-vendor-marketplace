const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const publicUser = (user) => ({
  id: user.id || user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  avatar: user.avatar || '',
  isEmailVerified: user.isEmailVerified || false,
})

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

/**
 * Standard Email & Password Registration
 */
async function register(req, res, next) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''

    const errors = {}
    if (name.length < 2 || name.length > 100) errors.name = 'Name must be between 2 and 100 characters.'
    if (!emailPattern.test(email) || email.length > 254) errors.email = 'Enter a valid email address.'
    if (phone && (phone.replace(/\D/g, '').length < 7 || phone.length > 30)) {
      errors.phone = 'Enter a valid phone number.'
    }
    if (password.length < 8 || password.length > 128) errors.password = 'Password must be between 8 and 128 characters.'
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Please correct the highlighted fields.', errors })
    }

    if (await User.exists({ email })) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
        errors: { email: 'This email is already registered.' },
      })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({
      name,
      email,
      phone,
      password: hashed,
      role: 'customer',
      isEmailVerified: false,
    })

    // Send Welcome Email in background via Nodemailer
    sendWelcomeEmail({ to: user.email, name: user.name, role: user.role }).catch((err) =>
      console.warn('[Register] Welcome email notice:', err.message)
    )

    return res.status(201).json({
      message: 'Account created successfully. Please sign in.',
      user: publicUser(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
        errors: { email: 'This email is already registered.' },
      })
    }
    next(error)
  }
}

/**
 * Standard Email & Password Login
 */
async function login(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    if (!emailPattern.test(email) || !password) {
      return res.status(400).json({ message: 'Enter a valid email and password.' })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' })
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    })
    return res.json({ message: 'Signed in successfully.', token, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
}

/**
 * Google OAuth Authentication (Sign In & Sign Up)
 */
async function googleAuth(req, res, next) {
  try {
    const { credential, accessToken } = req.body
    if (!credential && !accessToken) {
      return res.status(400).json({ message: 'Missing Google authentication token.' })
    }

    let payload = null

    // 1. Verify credential via Google OAuth Library or fallback to decoded payload / tokeninfo
    if (credential) {
      try {
        if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('your_google_client_id')) {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
          })
          payload = ticket.getPayload()
        } else {
          // If in local dev or token verification fallback
          const decoded = jwt.decode(credential)
          if (decoded && decoded.email) {
            payload = decoded
          }
        }
      } catch (verifyErr) {
        console.warn('[GoogleAuth] Token verification fallback:', verifyErr.message)
        const decoded = jwt.decode(credential)
        if (decoded && decoded.email) {
          payload = decoded
        }
      }
    }

    // 2. Fetch userinfo using accessToken if credential wasn't an ID token
    if (!payload && accessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (userInfoRes.ok) {
          payload = await userInfoRes.json()
        }
      } catch (fetchErr) {
        console.warn('[GoogleAuth] Failed to fetch userinfo with access token:', fetchErr.message)
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google authentication token.' })
    }

    const email = payload.email.toLowerCase().trim()
    const name = payload.name || payload.given_name || email.split('@')[0]
    const googleId = payload.sub || payload.id
    const avatar = payload.picture || ''

    let isNewUser = false
    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (user) {
      // Existing user: Link googleId and avatar if not yet linked
      let changed = false
      if (!user.googleId) {
        user.googleId = googleId
        changed = true
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar
        changed = true
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true
        changed = true
      }
      if (changed) await user.save()
    } else {
      // New User: Create customer account
      isNewUser = true
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        role: 'customer',
        isEmailVerified: true,
      })

      // Send Welcome Email
      sendWelcomeEmail({ to: user.email, name: user.name, role: user.role }).catch((err) =>
        console.warn('[GoogleAuth] Welcome email notice:', err.message)
      )
    }

    // Generate JWT token
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    })

    return res.json({
      message: isNewUser ? 'Account registered successfully with Google.' : 'Signed in with Google.',
      token,
      user: publicUser(user),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get Current Logged-in User Profile
 */
function me(req, res) {
  return res.json({ user: publicUser(req.user) })
}

/**
 * Logout
 */
function logout(req, res) {
  return res.json({ message: 'Signed out. Please discard the session token.' })
}

/**
 * Forgot Password (Sends 6-digit OTP via Nodemailer)
 */
async function forgotPassword(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.', errors: { email: 'Enter a valid email address.' } })
    }

    const user = await User.findOne({ email })
    if (!user) {
      // Return success message even if email not found to prevent user enumeration
      return res.json({
        message: 'If an account exists with this email, a 6-digit verification code has been dispatched.',
      })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOtp = await bcrypt.hash(otp, 8)

    user.resetPasswordOtp = hashedOtp
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 mins
    await user.save()

    // Send email via Nodemailer
    await sendPasswordResetEmail({ to: user.email, name: user.name, otp })

    return res.json({
      message: 'A 6-digit verification code has been sent to your email address.',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Reset Password with OTP
 */
async function resetPassword(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : ''
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : ''

    const errors = {}
    if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.'
    if (otp.length !== 6) errors.otp = 'Enter the 6-digit verification code.'
    if (newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters long.'
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed.', errors })

    const user = await User.findOne({
      email,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordOtp')

    if (!user || !user.resetPasswordOtp) {
      return res.status(400).json({ message: 'The verification code has expired or is invalid. Please request a new code.' })
    }

    const isValid = await bcrypt.compare(otp, user.resetPasswordOtp)
    if (!isValid) {
      return res.status(400).json({ message: 'Incorrect verification code. Please check your email and try again.' })
    }

    // Update password & clear OTP
    user.password = await bcrypt.hash(newPassword, 12)
    user.resetPasswordOtp = null
    user.resetPasswordExpires = null
    await user.save()

    return res.json({
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  googleAuth,
  me,
  logout,
  forgotPassword,
  resetPassword,
}
