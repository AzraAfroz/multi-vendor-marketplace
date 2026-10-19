const service = require('../services/adminCatalogService')

// Categories
async function listCategories(req, res, next) {
  try {
    const categories = await service.listCategories()
    return res.json({ categories })
  } catch (error) { return next(error) }
}

async function getCategory(req, res, next) {
  try {
    const category = await service.getCategoryById(req.params.id)
    return res.json({ category })
  } catch (error) { return next(error) }
}

async function createCategory(req, res, next) {
  try {
    const category = await service.createCategory(req.body)
    return res.status(201).json({ message: 'Category created successfully.', category })
  } catch (error) { return next(error) }
}

async function updateCategory(req, res, next) {
  try {
    const category = await service.updateCategory(req.params.id, req.body)
    return res.json({ message: 'Category updated successfully.', category })
  } catch (error) { return next(error) }
}

async function deleteCategory(req, res, next) {
  try {
    const result = await service.deleteCategory(req.params.id)
    return res.json(result)
  } catch (error) { return next(error) }
}

// Brands
async function listBrands(req, res, next) {
  try {
    const brands = await service.listBrands()
    return res.json({ brands })
  } catch (error) { return next(error) }
}

async function getBrand(req, res, next) {
  try {
    const brand = await service.getBrandById(req.params.id)
    return res.json({ brand })
  } catch (error) { return next(error) }
}

async function createBrand(req, res, next) {
  try {
    const brand = await service.createBrand(req.body)
    return res.status(201).json({ message: 'Brand created successfully.', brand })
  } catch (error) { return next(error) }
}

async function updateBrand(req, res, next) {
  try {
    const brand = await service.updateBrand(req.params.id, req.body)
    return res.json({ message: 'Brand updated successfully.', brand })
  } catch (error) { return next(error) }
}

async function deleteBrand(req, res, next) {
  try {
    const result = await service.deleteBrand(req.params.id)
    return res.json(result)
  } catch (error) { return next(error) }
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
}
