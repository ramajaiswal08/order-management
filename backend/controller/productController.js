const asyncHandler    = require('../utils/asyncHandler');
const productService  = require('../services/productService');

exports.getAll = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const data = await productService.getAll({ 
    ...filters, 
    page: parseInt(page) || 1, 
    limit: parseInt(limit) || 12 
  });
  res.json({ success: true, data });
});

exports.getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  res.json({ success: true, data: { product } });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await productService.getCategories();
  res.json({ success: true, data: { categories } });
});
