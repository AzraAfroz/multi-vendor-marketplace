const path = require('node:path')
const fs = require('node:fs')
const crypto = require('node:crypto')
const multer = require('multer')

const uploadDirectory = path.resolve(__dirname, '../../uploads/products')
fs.mkdirSync(uploadDirectory, { recursive: true })

const mimeToExt = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => {
    const ext = mimeToExt[file.mimetype] || path.extname(file.originalname) || '.jpg'
    const name = `${crypto.randomUUID()}${ext}`
    cb(null, name)
  },
})

const fileFilter = (req, file, cb) => {
  if (mimeToExt[file.mimetype]) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'))
  }
}

const uploadProductImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
}).single('image')

module.exports = uploadProductImage
