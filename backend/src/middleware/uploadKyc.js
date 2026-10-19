const multer = require('multer')

const uploadKyc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('document')

module.exports = uploadKyc
