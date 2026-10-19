const vendorService = require('../services/vendorService')
const HttpError = require('../utils/HttpError')
const { sendVendorStatusEmail } = require('../services/emailService')

const statuses = ['draft', 'pending', 'approved', 'rejected']

async function listVendors(req, res, next) {
  try {
    const status = req.query.status || 'pending'
    if (!statuses.includes(status)) throw new HttpError(400, 'Status must be draft, pending, approved, or rejected.')
    const vendors = await vendorService.listApplications(status)
    return res.json({ vendors })
  } catch (error) {
    return next(error)
  }
}

async function reviewVendor(req, res, next) {
  try {
    const { decision } = req.body
    if (!['approve', 'reject'].includes(decision)) throw new HttpError(400, 'Decision must be approve or reject.')
    const vendor = await vendorService.reviewApplication(req.params.vendorId, req.user._id, decision)

    // Notify vendor via email of approval or rejection
    if (vendor.owner?.email) {
      sendVendorStatusEmail({
        to: vendor.owner.email,
        vendorName: vendor.storeName,
        status: vendor.status,
      }).catch((err) => console.warn('[VendorEmail] Status update warning:', err.message))
    }

    return res.json({
      message: `Vendor application ${decision === 'approve' ? 'approved' : 'rejected'}.`,
      vendor,
    })
  } catch (error) {
    return next(error)
  }
}

async function getKycDocument(req, res, next) {
  try {
    const document = await vendorService.getKycDocument(req.params.vendorId)
    res.type(document.mimeType)
    res.set('Cache-Control', 'private, no-store')
    res.set('X-Content-Type-Options', 'nosniff')
    res.set('Content-Disposition', 'inline; filename="vendor-verification-document"')
    return res.sendFile(document.filePath)
  } catch (error) {
    return next(error)
  }
}

module.exports = { listVendors, reviewVendor, getKycDocument }
