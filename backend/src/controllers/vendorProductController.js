const service = require('../services/vendorProductService')
const HttpError = require('../utils/HttpError')

async function listProducts(req, res, next) {
  try {
    const result = await service.listProducts(req.vendor._id, req.query)
    return res.json(result)
  } catch (error) { return next(error) }
}

async function getProduct(req, res, next) {
  try {
    const product = await service.getProductById(req.vendor._id, req.params.id)
    return res.json({ product })
  } catch (error) { return next(error) }
}

async function createProduct(req, res, next) {
  try {
    const product = await service.createProduct(req.vendor._id, req.body)
    return res.status(201).json({ message: 'Product created successfully.', product })
  } catch (error) { return next(error) }
}

async function updateProduct(req, res, next) {
  try {
    const product = await service.updateProduct(req.vendor._id, req.params.id, req.body)
    return res.json({ message: 'Product updated successfully.', product })
  } catch (error) { return next(error) }
}

async function deleteProduct(req, res, next) {
  try {
    const result = await service.deleteProduct(req.vendor._id, req.params.id)
    return res.json(result)
  } catch (error) { return next(error) }
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) throw new HttpError(400, 'Please select a JPEG, PNG, or WebP image to upload.')
    const url = `/uploads/products/${req.file.filename}`
    return res.status(201).json({ message: 'Image uploaded successfully.', url })
  } catch (error) { return next(error) }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
}
