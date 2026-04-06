const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/productService');
const HttpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');
const MESSAGES = require('../constants/messages');

exports.getAll = asyncHandler(async (req, res) => {
  const { page, limit, search, category } = req.query;

  logger.info(`Fetching products | page=${page}, limit=${limit}`);

  const data = await productService.getAll({
    search,
    category,
    page,
    limit
  });

  res.status(HttpStatus.OK).json({
    success: true,
    data,
    message: MESSAGES.PRODUCTS_FETCHED
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.info(`Fetching product | id=${id}`);

  const product = await productService.getById(id);

  res.status(HttpStatus.OK).json({
    success: true,
    data: { product },
    message: MESSAGES.PRODUCT_FETCHED
  });
});

exports.getCategories = asyncHandler(async (req, res) => {
  logger.info(`Fetching product categories`);

  const categories = await productService.getCategories();

  res.status(HttpStatus.OK).json({
    success: true,
    data: { categories },
    message: MESSAGES.CATEGORIES_FETCHED
  });
});