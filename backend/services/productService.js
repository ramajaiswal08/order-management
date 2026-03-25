const db = require('../config/db');

/**
 * Get a paginated, filtered list of products.
 */
exports.getAll = async ({ search, category, page = 1, limit = 12 }) => {
  const offset = (Number(page) - 1) * Number(limit);
  let where = 'WHERE 1=1';
  const params = [];
  if (search)   { where += ' AND p.PRODUCT_DESC LIKE ?';    params.push(`%${search}%`); }
  if (category) { where += ' AND p.PRODUCT_CLASS_CODE = ?'; params.push(category); }

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM product p ${where}`,
    params
  );
  const [products] = await db.query(
    `SELECT p.PRODUCT_ID, p.PRODUCT_DESC, p.PRODUCT_CLASS_CODE,
            p.PRODUCT_PRICE AS PRICE, p.PRODUCT_QUANTITY_AVAIL AS STOCK,
            pc.PRODUCT_CLASS_DESC
     FROM product p
     JOIN product_class pc ON p.PRODUCT_CLASS_CODE = pc.PRODUCT_CLASS_CODE
     ${where}
     ORDER BY p.PRODUCT_ID DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );
  return { products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

/**
 * Get a single product by ID.
 */
exports.getById = async (productId) => {
  const [[p]] = await db.query(
    `SELECT p.PRODUCT_ID, p.PRODUCT_DESC, p.PRODUCT_CLASS_CODE,
            p.PRODUCT_PRICE AS PRICE, p.PRODUCT_QUANTITY_AVAIL AS STOCK,
            pc.PRODUCT_CLASS_DESC
     FROM product p
     JOIN product_class pc ON p.PRODUCT_CLASS_CODE = pc.PRODUCT_CLASS_CODE
     WHERE p.PRODUCT_ID = ?`,
    [productId]
  );
  if (!p) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  return p;
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
