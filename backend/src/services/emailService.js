const nodemailer = require('nodemailer')

let cachedTransporter = null

/**
 * Creates or retrieves the Nodemailer transporter.
 * Falls back gracefully to console logging / test account if SMTP credentials are not configured.
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
    return cachedTransporter
  }

  // Fallback for local development if credentials aren't set yet
  try {
    const testAccount = await nodemailer.createTestAccount()
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    console.log(`[EmailService] Using simulated Ethereal SMTP test account: ${testAccount.user}`)
    return cachedTransporter
  } catch (err) {
    console.warn('[EmailService] Failed to create Ethereal account, falling back to console logger:', err.message)
    cachedTransporter = {
      sendMail: async (options) => {
        console.log(`\n================== [EMAIL DISPATCHED] ==================`)
        console.log(`To: ${options.to}`)
        console.log(`Subject: ${options.subject}`)
        console.log(`Text Preview: ${options.text || options.html?.slice(0, 150)}...`)
        console.log(`=======================================================\n`)
        return { messageId: 'simulated_' + Date.now() }
      },
    }
    return cachedTransporter
  }
}

const DEFAULT_FROM = process.env.SMTP_FROM || '"ShopVerse Marketplace" <notifications@shopverse.com>'

/**
 * 1. Send Welcome Email upon registration
 */
async function sendWelcomeEmail({ to, name, role = 'customer' }) {
  try {
    const transporter = await getTransporter()
    const isVendor = role === 'vendor'
    const subject = isVendor
      ? 'Welcome to ShopVerse Vendor Network — Set Up Your Store'
      : 'Welcome to ShopVerse — Start Exploring Verified Sellers'

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #0a2e8c; padding: 32px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ShopVerse</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #93c5fd;">Multi-Vendor E-Commerce Marketplace</p>
        </div>
        <div style="padding: 32px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #0f172a;">Welcome, ${name}!</h2>
          <p>Thank you for joining <strong>ShopVerse</strong>. Your account has been created successfully.</p>
          ${
            isVendor
              ? `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
                  <strong style="color: #15803d; font-size: 14px;">Next step: Complete Vendor KYC</strong>
                  <p style="margin: 6px 0 0; font-size: 13px; color: #166534;">
                    To start listing products, head to your vendor onboarding page to upload your store verification document.
                  </p>
                </div>`
              : `<p>You can now browse thousands of authentic products from independent sellers, track express shipments, and save items to your wishlist.</p>`
          }
          <div style="text-align: center; margin: 32px 0 20px;">
            <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}" style="display: inline-block; background: #0a2e8c; color: #ffffff; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 13px;">
              ${isVendor ? 'Go to Vendor Dashboard' : 'Explore Marketplace'}
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 11px; color: #64748b; margin: 0; text-align: center;">
            &copy; 2026 ShopVerse Inc. 100% Genuine Inventory &bull; 24/7 Buyer Protection
          </p>
        </div>
      </div>
    `

    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    })

    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[EmailService] Preview Welcome Email: ${nodemailer.getTestMessageUrl(info)}`)
    }
    return info
  } catch (err) {
    console.error('[EmailService] Failed to send welcome email:', err.message)
  }
}

/**
 * 2. Send Password Reset OTP
 */
async function sendPasswordResetEmail({ to, name, otp }) {
  try {
    const transporter = await getTransporter()
    const subject = `Your ShopVerse Password Reset Code: ${otp}`

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #0a2e8c; padding: 28px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">ShopVerse Security</h1>
        </div>
        <div style="padding: 32px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 10px;">Password Reset Request</h2>
          <p>Hello ${name || 'Shopper'},</p>
          <p>We received a request to reset your ShopVerse password. Use the verification code below to complete your reset:</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0a2e8c; background: #eef2ff; border: 2px dashed #0a2e8c; padding: 12px 24px; border-radius: 12px; font-family: monospace;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center;">
            This code will expire in <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `

    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    })

    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[EmailService] Preview Password Reset Email: ${nodemailer.getTestMessageUrl(info)}`)
    }
    return info
  } catch (err) {
    console.error('[EmailService] Failed to send password reset email:', err.message)
    throw err
  }
}

/**
 * 3. Send Order Confirmation Email to Customer
 */
async function sendOrderConfirmationEmail({ to, name, order }) {
  try {
    const transporter = await getTransporter()
    const subject = `Order Confirmed: #${order.id || order._id} — ShopVerse Marketplace`

    const itemsRows = (order.items || [])
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a;">
            <strong>${item.name || item.product?.name || 'Product'}</strong>
            <div style="font-size: 11px; color: #64748b;">Sold by ${item.store?.name || 'Verified Vendor'} &bull; Qty: ${item.quantity}</div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; font-size: 13px;">
            ₹${item.price * item.quantity}
          </td>
        </tr>
      `
      )
      .join('')

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #0a2e8c; padding: 32px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">ShopVerse</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #93c5fd;">Thank You For Your Order!</p>
        </div>
        <div style="padding: 32px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 10px;">Hi ${name || 'Customer'},</h2>
          <p>We've received your order <strong>#${order.id || order._id}</strong>. The independent vendor merchants are now preparing your packages for dispatch.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <thead>
              <tr style="background: #f8fafc; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
                <th style="padding: 8px 10px;">Item</th>
                <th style="padding: 8px 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 12px 10px; font-weight: 700; font-size: 14px; border-top: 2px solid #e2e8f0;">Total Amount Paid</td>
                <td style="padding: 12px 10px; font-weight: 800; font-size: 16px; color: #0a2e8c; text-align: right; border-top: 2px solid #e2e8f0;">
                  ₹${order.totalAmount || order.subtotal || 0}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 12px;">
            <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Delivery Address:</strong>
            ${order.shippingAddress?.fullName || name}<br />
            ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''} ${order.shippingAddress?.postalCode || ''}<br />
            Phone: ${order.shippingAddress?.phone || 'On file'}
          </div>

          <div style="text-align: center; margin: 28px 0 16px;">
            <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/orders/${order.id || order._id}" style="display: inline-block; background: #0a2e8c; color: #ffffff; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 13px;">
              Track Live Order Status
            </a>
          </div>
        </div>
      </div>
    `

    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    })

    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[EmailService] Preview Order Confirmation Email: ${nodemailer.getTestMessageUrl(info)}`)
    }
    return info
  } catch (err) {
    console.error('[EmailService] Failed to send order confirmation email:', err.message)
  }
}

/**
 * 4. Send Vendor Notification when their product is ordered
 */
async function sendVendorOrderNotification({ to, vendorName, order, items }) {
  try {
    const transporter = await getTransporter()
    const subject = `New Customer Order Received: #${order.id || order._id} — ShopVerse Vendor Portal`

    const itemsList = (items || [])
      .map((i) => `<li><strong>${i.name || i.product?.name}</strong> &times; ${i.quantity} (₹${i.price * i.quantity})</li>`)
      .join('')

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #ea580c; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">New Order for ${vendorName}</h1>
        </div>
        <div style="padding: 28px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <p>Great news! A customer just placed an order containing your products on ShopVerse.</p>
          <div style="background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <strong style="color: #c2410c;">Items Ordered:</strong>
            <ul style="margin: 8px 0 0; padding-left: 20px;">
              ${itemsList}
            </ul>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            Please log in to your vendor orders dashboard to update fulfillment status and dispatch within 24–48 hours.
          </p>
          <div style="text-align: center; margin: 24px 0 10px;">
            <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/vendor/orders" style="display: inline-block; background: #0a2e8c; color: #ffffff; font-weight: 700; padding: 10px 24px; border-radius: 10px; text-decoration: none; font-size: 13px;">
              Manage Vendor Orders
            </a>
          </div>
        </div>
      </div>
    `

    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    })

    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[EmailService] Preview Vendor Alert Email: ${nodemailer.getTestMessageUrl(info)}`)
    }
    return info
  } catch (err) {
    console.error('[EmailService] Failed to send vendor order notification:', err.message)
  }
}

/**
 * 5. Send Vendor Application Status Update
 */
async function sendVendorStatusEmail({ to, vendorName, status, reason = '' }) {
  try {
    const transporter = await getTransporter()
    const isApproved = status === 'approved'
    const subject = isApproved
      ? `Congratulations! ${vendorName} is Approved on ShopVerse`
      : `Action Required: Verification Update for ${vendorName}`

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: ${isApproved ? '#0a2e8c' : '#b91c1c'}; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${isApproved ? 'Store Approved!' : 'Application Update'}</h1>
        </div>
        <div style="padding: 28px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <p>Hello ${vendorName},</p>
          <p>
            ${
              isApproved
                ? `Your vendor store and KYC verification documents have been reviewed and <strong>approved</strong> by our administration team. Your storefront is now active!`
                : `Your store verification requires attention. Status: <strong>${status}</strong>. ${reason || 'Please upload a replacement document.'}`
            }
          </p>
          <div style="text-align: center; margin: 24px 0 10px;">
            <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/vendor/store" style="display: inline-block; background: #0a2e8c; color: #ffffff; font-weight: 700; padding: 10px 24px; border-radius: 10px; text-decoration: none; font-size: 13px;">
              Open Store Dashboard
            </a>
          </div>
        </div>
      </div>
    `

    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    })

    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[EmailService] Preview Vendor Status Email: ${nodemailer.getTestMessageUrl(info)}`)
    }
    return info
  } catch (err) {
    console.error('[EmailService] Failed to send vendor status email:', err.message)
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendVendorOrderNotification,
  sendVendorStatusEmail,
}
