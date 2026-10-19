const vendorService = require('../services/vendorService')
const HttpError = require('../utils/HttpError')

async function getMyStore(req, res, next) {
  try {
    const vendor = await vendorService.getMyProfile(req.user._id)
    return res.json({ vendor })
  } catch (error) { return next(error) }
}

async function createMyStore(req, res, next) {
  try {
    const storeName = typeof req.body.storeName === 'string' ? req.body.storeName.trim() : ''
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''
    const errors = {}
    if (storeName.length < 2 || storeName.length > 80) errors.storeName = 'Store name must be between 2 and 80 characters.'
    if (req.body.description !== undefined && typeof req.body.description !== 'string') errors.description = 'Description must be text.'
    if (description.length > 500) errors.description = 'Description must be 500 characters or fewer.'
    if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields.', errors)
    const vendor = await vendorService.createProfile(req.user._id, { storeName, description })
    return res.status(201).json({ message: 'Your store profile has been created. Upload a verification document to submit it for review.', vendor })
  } catch (error) { return next(error) }
}

async function submitKyc(req, res, next) {
  try {
    const vendor = await vendorService.submitKyc(req.user._id, req.file)
    return res.status(202).json({ message: 'Verification document uploaded. Your store is pending admin review.', vendor })
  } catch (error) { return next(error) }
}

module.exports = { getMyStore, createMyStore, submitKyc }
