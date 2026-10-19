const { randomUUID } = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')
const Vendor = require('../models/Vendor')
const User = require('../models/User')
const HttpError = require('../utils/HttpError')

const uploadDirectory = path.resolve(process.env.KYC_UPLOAD_DIR || path.join(__dirname, '../../uploads/vendor-kyc'))
const extensions = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' }

function present(vendor) {
  if (!vendor) return null
  const owner = vendor.owner?.name || vendor.owner?.email
    ? { id: vendor.owner._id, name: vendor.owner.name, email: vendor.owner.email }
    : vendor.owner?.toString?.() || vendor.owner
  return {
    id: vendor.id,
    storeName: vendor.storeName,
    description: vendor.description,
    owner,
    status: vendor.status || 'draft',
    kycDocument: vendor.kycDocument?.storageKey ? {
      mimeType: vendor.kycDocument.mimeType,
      uploadedAt: vendor.kycDocument.uploadedAt,
    } : null,
    reviewedAt: vendor.reviewedAt || null,
    createdAt: vendor.createdAt,
  }
}

function detectDocumentType(buffer) {
  if (buffer.subarray(0, 5).toString() === '%PDF-' && buffer.subarray(-1024).includes(Buffer.from('%%EOF'))) return 'application/pdf'
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && buffer.subarray(12, 16).toString() === 'IHDR'
    && buffer.subarray(-8).equals(Buffer.from([0, 0, 0, 0, 73, 69, 78, 68]))) return 'image/png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    && buffer.subarray(-2).equals(Buffer.from([0xff, 0xd9]))) return 'image/jpeg'
  return null
}

function documentPath(storageKey) {
  if (!/^[\da-f-]{36}\.(pdf|jpg|png)$/i.test(storageKey || '')) throw new HttpError(404, 'KYC document was not found.')
  return path.join(uploadDirectory, storageKey)
}

async function getMyProfile(ownerId) {
  return present(await Vendor.findOne({ owner: ownerId }))
}

async function createProfile(ownerId, values) {
  if (await Vendor.exists({ owner: ownerId })) throw new HttpError(409, 'You already have a store profile.')
  try {
    const vendor = await Vendor.create({ owner: ownerId, storeName: values.storeName, description: values.description })
    try {
      const result = await User.updateOne({ _id: ownerId }, { $set: { role: 'vendor' } })
      if (result.matchedCount !== 1) throw new HttpError(401, 'Your user account is no longer available.')
    } catch (error) {
      await Vendor.deleteOne({ _id: vendor._id })
      throw error
    }
    return present(vendor)
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, 'A store profile already exists for this account.')
    throw error
  }
}

async function submitKyc(ownerId, file) {
  if (!file) throw new HttpError(400, 'Choose a PDF, JPG, or PNG verification document.')
  const actualMimeType = detectDocumentType(file.buffer)
  if (!actualMimeType || actualMimeType !== file.mimetype || !extensions[actualMimeType]) {
    throw new HttpError(400, 'The uploaded file must be a valid PDF, JPG, or PNG document.')
  }
  const vendor = await Vendor.findOne({ owner: ownerId })
  if (!vendor) throw new HttpError(404, 'Create your store profile before uploading a verification document.')
  if (vendor.status === 'approved') throw new HttpError(409, 'Your store is approved; KYC changes require administrator support.')

  const storageKey = `${randomUUID()}${extensions[actualMimeType]}`
  const nextPath = documentPath(storageKey)
  await fs.mkdir(uploadDirectory, { recursive: true })
  await fs.writeFile(nextPath, file.buffer, { flag: 'wx' })
  const previousKey = vendor.kycDocument?.storageKey
  try {
    vendor.kycDocument = { storageKey, mimeType: actualMimeType, uploadedAt: new Date() }
    vendor.status = 'pending'
    vendor.reviewedAt = null
    vendor.reviewedBy = null
    await vendor.save()
  } catch (error) {
    await fs.unlink(nextPath).catch(() => {})
    throw error
  }
  if (previousKey) await fs.unlink(documentPath(previousKey)).catch(() => {})
  return present(vendor)
}

async function listApplications(status) {
  const vendors = await Vendor.find({ status }).populate('owner', 'name email').sort({ createdAt: 1 })
  return vendors.map(present)
}

async function reviewApplication(id, adminId, decision) {
  if (!/^[\da-f]{24}$/i.test(id)) throw new HttpError(404, 'Vendor application was not found.')
  const vendor = await Vendor.findById(id)
  if (!vendor) throw new HttpError(404, 'Vendor application was not found.')
  if (vendor.status !== 'pending' || !vendor.kycDocument?.storageKey) throw new HttpError(409, 'Only pending applications with a KYC document can be reviewed.')
  vendor.status = decision === 'approve' ? 'approved' : 'rejected'
  vendor.reviewedBy = adminId
  vendor.reviewedAt = new Date()
  await vendor.save()
  return present(vendor)
}

async function getKycDocument(id) {
  if (!/^[\da-f]{24}$/i.test(id)) throw new HttpError(404, 'KYC document was not found.')
  const vendor = await Vendor.findById(id)
  if (!vendor?.kycDocument?.storageKey) throw new HttpError(404, 'KYC document was not found.')
  const filePath = documentPath(vendor.kycDocument.storageKey)
  await fs.access(filePath).catch(() => { throw new HttpError(404, 'KYC document file is unavailable.') })
  return { filePath, mimeType: vendor.kycDocument.mimeType }
}

module.exports = { present, getMyProfile, createProfile, submitKyc, listApplications, reviewApplication, getKycDocument }
