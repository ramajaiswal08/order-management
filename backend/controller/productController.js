const prisma = require('../config/db');
const logger = require('../utils/logger');
const HttpStatus = require('../constants/httpStatus');
const AppError = require('../utils/AppError');
const ERRORS = require('../constants/errors');

const toInt = (val, def = 0) => Number(val) || def;

// GET ALL

exports.getAll = async ({ search, category, page = 1, limit = 12 }) => {
  const p = Math.max(toInt(page, 1), 1);
  const l = Math.max(toInt(limit, 12), 1);
  const offset = (p - 1) * l;

  const where = {};

  if (search) {
    where.productDesc = {
      contains: search,
      mode: 'insensitive'  
    };
  }

  if (category) {
    where.productClassCode = toInt(category);
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: {
        productId: true,
        productDesc: true,
        productClassCode: true,
        productPrice: true,
        productQuantityAvail: true,
        productClass: {
          select: { productClassDesc: true }
        }
      },
      orderBy: { productId: 'desc' },
      skip: offset,
      take: l
    })
  ]);

  logger.info(
    `Products fetched | page=${p}, limit=${l}, count=${products.length}`
  );

  return {
    products: products.map(p => ({
      PRODUCT_ID: p.productId,
      PRODUCT_DESC: p.productDesc,
      PRODUCT_CLASS_CODE: p.productClassCode,
      PRICE: p.productPrice,
      STOCK: p.productQuantityAvail,
      PRODUCT_CLASS_DESC: p.productClass?.productClassDesc
    })),
    total,
    page: p,
    pages: Math.ceil(total / l)
  };
};

//GET BY ID

exports.getById = async (productId) => {
  const id = toInt(productId);

  const product = await prisma.product.findUnique({
    where: { productId: id },
    select: {
      productId: true,
      productDesc: true,
      productClassCode: true,
      productPrice: true,
      productQuantityAvail: true,
      productClass: {
        select: { productClassDesc: true }
      }
    }
  });

  if (!product) {
    logger.warn(`Product not found: ${productId}`);
    throw new AppError(ERRORS.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return {
    PRODUCT_ID: product.productId,
    PRODUCT_DESC: product.productDesc,
    PRODUCT_CLASS_CODE: product.productClassCode,
    PRICE: product.productPrice,
    STOCK: product.productQuantityAvail,
    PRODUCT_CLASS_DESC: product.productClass?.productClassDesc
  };
};

//GET CATEGORIES

exports.getCategories = async () => {
  const cats = await prisma.productClass.findMany({
    select: {
      code: true,
      productClassDesc: true,
      _count: { select: { products: true } }
    },
    orderBy: { productClassDesc: 'asc' }
  });

  logger.info(`Categories fetched | count=${cats.length}`);

  return cats.map(cat => ({
    PRODUCT_CLASS_CODE: cat.code,
    PRODUCT_CLASS_DESC: cat.productClassDesc,
    COUNT: cat._count.products
  }));
};