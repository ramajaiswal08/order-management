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
    where.productClassCode = category;
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        productClass: {
          select: {
            productClassDesc: true
          }
        }
      },
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

  // Transform the data to match the expected format
  const transformedProducts = products.map(product => ({
    PRODUCT_ID: product.productId,
    PRODUCT_DESC: product.productDesc,
    PRODUCT_CLASS_CODE: product.productClassCode,
    PRICE: product.productPrice,
    STOCK: product.productQuantityAvail,
    PRODUCT_CLASS_DESC: product.productClass?.productClassDesc
  }));

  return {
    products: transformedProducts,
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
    where: { productId: parseInt(productId) },
    include: {
      productClass: {
        select: {
          productClassDesc: true
        }
      }
    },
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

  // Transform to match expected format
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
  const [cats] = await db.query(
    `SELECT pc.PRODUCT_CLASS_CODE, pc.PRODUCT_CLASS_DESC, COUNT(p.PRODUCT_ID) AS count
     FROM product_class pc
     LEFT JOIN product p ON pc.PRODUCT_CLASS_CODE = p.PRODUCT_CLASS_CODE
     GROUP BY pc.PRODUCT_CLASS_CODE, pc.PRODUCT_CLASS_DESC
     ORDER BY pc.PRODUCT_CLASS_DESC`
  );
  return cats;
};
