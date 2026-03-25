const asyncHandler    = require('../utils/asyncHandler');
const productService  = require('../services/productService');

exports.getAll = asyncHandler(async (req, res) => {
  const data = await productService.getAll(req.query);
  res.json(data);
});

exports.getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  res.json({ product });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await productService.getCategories();
  res.json({ categories });
});
