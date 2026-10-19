const marketplaceService = require('../services/publicMarketplaceService')

function handler(method, key) {
  return async function publicListing(req, res, next) {
    try { return res.json({ [key]: await marketplaceService[method](req.query) }) }
    catch (error) { return next(error) }
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await marketplaceService.getProductById(req.params.id)
    return res.json({ product })
  } catch (error) {
    return next(error)
  }
}

async function getStoreById(req, res, next) {
  try {
    const store = await marketplaceService.getStoreById(req.params.id)
    return res.json({ store })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  listCategories: handler('listCategories', 'categories'),
  listBrands: handler('listBrands', 'brands'),
  listStores: handler('listStores', 'stores'),
  getStoreById,
  listProducts: handler('listProducts', 'products'),
  getProductById,
}
