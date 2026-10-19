const mongoose = require('mongoose')
const Category = require('../models/Category')
const Brand = require('../models/Brand')
const Product = require('../models/Product')
const HttpError = require('../utils/HttpError')
const slugify = require('../utils/slugify')

function validateId(id, name = 'ID') {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw new HttpError(400, `${name} must be a valid ID.`)
  }
  return new mongoose.Types.ObjectId(id)
}

// ======================== CATEGORIES ========================

async function listCategories() {
  return Category.find()
    .populate('parent', 'name slug')
    .sort({ sortOrder: 1, name: 1 })
    .lean()
}

async function getCategoryById(id) {
  const categoryId = validateId(id, 'Category ID')
  const category = await Category.findById(categoryId).populate('parent', 'name slug').lean()
  if (!category) throw new HttpError(404, 'Category was not found.')
  return category
}

async function createCategory(values) {
  const name = typeof values.name === 'string' ? values.name.trim() : ''
  const description = typeof values.description === 'string' ? values.description.trim() : ''
  const imageUrl = typeof values.imageUrl === 'string' ? values.imageUrl.trim() : ''
  const sortOrder = values.sortOrder !== undefined ? Number(values.sortOrder) : 0

  const errors = {}
  if (name.length < 2 || name.length > 100) errors.name = 'Category name must be between 2 and 100 characters.'
  if (description.length > 500) errors.description = 'Description must be 500 characters or fewer.'
  if (!Number.isInteger(sortOrder)) errors.sortOrder = 'Sort order must be an integer.'

  let slug = typeof values.slug === 'string' && values.slug.trim()
    ? slugify(values.slug)
    : slugify(name)

  if (!slug) errors.slug = 'A valid slug could not be generated from the category name.'

  let parentId = null
  if (values.parent) {
    if (!mongoose.isValidObjectId(values.parent)) {
      errors.parent = 'Parent category must be a valid ID.'
    } else {
      const parentExists = await Category.exists({ _id: values.parent })
      if (!parentExists) errors.parent = 'Parent category does not exist.'
      else parentId = values.parent
    }
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields.', errors)

  if (await Category.exists({ slug })) {
    throw new HttpError(409, 'A category with this slug already exists.', {
      name: 'A category with this name or slug already exists.',
      slug: 'This slug is already in use.',
    })
  }

  try {
    const category = await Category.create({
      name,
      slug,
      description,
      imageUrl,
      parent: parentId,
      sortOrder,
      isActive: values.isActive !== undefined ? Boolean(values.isActive) : true,
    })
    return category
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(409, 'A category with this slug already exists.', {
        name: 'A category with this name or slug already exists.',
        slug: 'This slug is already in use.',
      })
    }
    throw error
  }
}

async function updateCategory(id, values) {
  const categoryId = validateId(id, 'Category ID')
  const category = await Category.findById(categoryId)
  if (!category) throw new HttpError(404, 'Category was not found.')

  const errors = {}

  if (values.name !== undefined) {
    const name = typeof values.name === 'string' ? values.name.trim() : ''
    if (name.length < 2 || name.length > 100) errors.name = 'Category name must be between 2 and 100 characters.'
    else category.name = name
  }

  if (values.slug !== undefined) {
    const slug = slugify(values.slug)
    if (!slug) errors.slug = 'Slug must be valid text.'
    else if (slug !== category.slug) {
      if (await Category.exists({ slug, _id: { $ne: categoryId } })) {
        errors.slug = 'This slug is already used by another category.'
      } else {
        category.slug = slug
      }
    }
  }

  if (values.description !== undefined) {
    const desc = typeof values.description === 'string' ? values.description.trim() : ''
    if (desc.length > 500) errors.description = 'Description must be 500 characters or fewer.'
    else category.description = desc
  }

  if (values.imageUrl !== undefined) {
    category.imageUrl = typeof values.imageUrl === 'string' ? values.imageUrl.trim() : ''
  }

  if (values.sortOrder !== undefined) {
    const order = Number(values.sortOrder)
    if (!Number.isInteger(order)) errors.sortOrder = 'Sort order must be an integer.'
    else category.sortOrder = order
  }

  if (values.parent !== undefined) {
    if (!values.parent) {
      category.parent = null
    } else if (!mongoose.isValidObjectId(values.parent)) {
      errors.parent = 'Parent category must be a valid ID.'
    } else if (String(values.parent) === String(categoryId)) {
      errors.parent = 'A category cannot be its own parent.'
    } else if (await Category.exists({ _id: values.parent, parent: categoryId })) {
      errors.parent = 'A category cannot have one of its subcategories as its parent.'
    } else {
      const parentExists = await Category.exists({ _id: values.parent })
      if (!parentExists) errors.parent = 'Parent category does not exist.'
      else category.parent = values.parent
    }
  }

  if (values.isActive !== undefined) {
    category.isActive = Boolean(values.isActive)
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields.', errors)

  try {
    await category.save()
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(409, 'A category with this slug already exists.', {
        name: 'A category with this name or slug already exists.',
        slug: 'This slug is already in use.',
      })
    }
    throw error
  }
  return Category.findById(categoryId).populate('parent', 'name slug').lean()
}

async function deleteCategory(id) {
  const categoryId = validateId(id, 'Category ID')
  const category = await Category.findById(categoryId)
  if (!category) throw new HttpError(404, 'Category was not found.')

  const associatedProducts = await Product.countDocuments({ category: categoryId })
  if (associatedProducts > 0) {
    throw new HttpError(409, `Cannot delete category because ${associatedProducts} product(s) reference it. Deactivate it instead.`)
  }

  const childCategories = await Category.countDocuments({ parent: categoryId })
  if (childCategories > 0) {
    throw new HttpError(409, `Cannot delete category because ${childCategories} subcategory(ies) reference it. Reassign or delete them first.`)
  }

  await Category.deleteOne({ _id: categoryId })
  return { message: 'Category deleted successfully.' }
}

// ======================== BRANDS ========================

async function listBrands() {
  return Brand.find().sort({ name: 1 }).lean()
}

async function getBrandById(id) {
  const brandId = validateId(id, 'Brand ID')
  const brand = await Brand.findById(brandId).lean()
  if (!brand) throw new HttpError(404, 'Brand was not found.')
  return brand
}

async function createBrand(values) {
  const name = typeof values.name === 'string' ? values.name.trim() : ''
  const description = typeof values.description === 'string' ? values.description.trim() : ''
  const logoUrl = typeof values.logoUrl === 'string' ? values.logoUrl.trim() : ''

  const errors = {}
  if (name.length < 2 || name.length > 100) errors.name = 'Brand name must be between 2 and 100 characters.'
  if (description.length > 500) errors.description = 'Description must be 500 characters or fewer.'

  let slug = typeof values.slug === 'string' && values.slug.trim()
    ? slugify(values.slug)
    : slugify(name)

  if (!slug) errors.slug = 'A valid slug could not be generated from the brand name.'

  if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields.', errors)

  if (await Brand.exists({ slug })) {
    throw new HttpError(409, 'A brand with this slug already exists.', {
      name: 'A brand with this name or slug already exists.',
      slug: 'This slug is already in use.',
    })
  }

  try {
    const brand = await Brand.create({
      name,
      slug,
      description,
      logoUrl,
      isActive: values.isActive !== undefined ? Boolean(values.isActive) : true,
    })
    return brand
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(409, 'A brand with this slug already exists.', {
        name: 'A brand with this name or slug already exists.',
        slug: 'This slug is already in use.',
      })
    }
    throw error
  }
}

async function updateBrand(id, values) {
  const brandId = validateId(id, 'Brand ID')
  const brand = await Brand.findById(brandId)
  if (!brand) throw new HttpError(404, 'Brand was not found.')

  const errors = {}

  if (values.name !== undefined) {
    const name = typeof values.name === 'string' ? values.name.trim() : ''
    if (name.length < 2 || name.length > 100) errors.name = 'Brand name must be between 2 and 100 characters.'
    else brand.name = name
  }

  if (values.slug !== undefined) {
    const slug = slugify(values.slug)
    if (!slug) errors.slug = 'Slug must be valid text.'
    else if (slug !== brand.slug) {
      if (await Brand.exists({ slug, _id: { $ne: brandId } })) {
        errors.slug = 'This slug is already used by another brand.'
      } else {
        brand.slug = slug
      }
    }
  }

  if (values.description !== undefined) {
    const desc = typeof values.description === 'string' ? values.description.trim() : ''
    if (desc.length > 500) errors.description = 'Description must be 500 characters or fewer.'
    else brand.description = desc
  }

  if (values.logoUrl !== undefined) {
    brand.logoUrl = typeof values.logoUrl === 'string' ? values.logoUrl.trim() : ''
  }

  if (values.isActive !== undefined) {
    brand.isActive = Boolean(values.isActive)
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Please correct the highlighted fields.', errors)

  try {
    await brand.save()
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(409, 'A brand with this slug already exists.', {
        name: 'A brand with this name or slug already exists.',
        slug: 'This slug is already in use.',
      })
    }
    throw error
  }
  return Brand.findById(brandId).lean()
}

async function deleteBrand(id) {
  const brandId = validateId(id, 'Brand ID')
  const brand = await Brand.findById(brandId)
  if (!brand) throw new HttpError(404, 'Brand was not found.')

  const associatedProducts = await Product.countDocuments({ brand: brandId })
  if (associatedProducts > 0) {
    throw new HttpError(409, `Cannot delete brand because ${associatedProducts} product(s) reference it. Deactivate it instead.`)
  }

  await Brand.deleteOne({ _id: brandId })
  return { message: 'Brand deleted successfully.' }
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
}
