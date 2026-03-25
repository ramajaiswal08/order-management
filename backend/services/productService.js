const prisma = require('../config/db');

/**
 * Get a paginated, filtered list of products.
 */
exports.getAll = async ({ search, category, page = 1, limit = 12 }) => {
  const offset = (Number(page) - 1) * Number(limit);

  const where = {};
  if (search) {
    where.productDesc = {
      contains: search
    };
  }
  if (category) {
    where.productClassCode = Number(category);
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
          select: {
            productClassDesc: true
          }
        }
      },
      orderBy: {
        productId: 'desc'
      },
      skip: offset,
      take: Number(limit)
    })
  ]);

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
    page: Number(page),
    pages: Math.ceil(total / Number(limit))
  };
};
/**
 * Get a single product by ID.
 */
exports.getById = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { productId: Number(productId) },
    select: {
      productId: true,
      productDesc: true,
      productClassCode: true,
      productPrice: true,
      productQuantityAvail: true,
      productClass: {
        select: {
          productClassDesc: true
        }
      }
    }
  });

  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
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

/**
 * Get all product categories with product count.
 */
exports.getCategories = async () => {
  const cats = await prisma.productClass.findMany({
    select: {
      code: true,                 // use "code" instead of "productClassCode"
      productClassDesc: true,
      _count: {
        select: { products: true }
      }
    },
    orderBy: {
      productClassDesc: 'asc'
    }
  });

  return cats.map(cat => ({
    PRODUCT_CLASS_CODE: cat.code,       // map "code" to PRODUCT_CLASS_CODE
    PRODUCT_CLASS_DESC: cat.productClassDesc,
    count: cat._count.products
  }));
};
