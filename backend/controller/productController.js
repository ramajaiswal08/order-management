const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let where = 'WHERE 1=1';
    const params = [];
    if (search)   { where += ' AND p.PRODUCT_DESC LIKE ?';       params.push(`%${search}%`); }
    if (category) { where += ' AND p.PRODUCT_CLASS_CODE = ?';    params.push(category); }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM product p ${where}`, params
    );
    const [products] = await db.query(
      `SELECT p.PRODUCT_ID, p.PRODUCT_DESC, p.PRODUCT_CLASS_CODE, p.PRODUCT_PRICE as PRICE, p.PRODUCT_QUANTITY_AVAIL as STOCK, pc.PRODUCT_CLASS_DESC
       FROM product p
       JOIN product_class pc ON p.PRODUCT_CLASS_CODE = pc.PRODUCT_CLASS_CODE
       ${where} ORDER BY p.PRODUCT_ID DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
   res.status(500).json({ message: 'An internal server error occurred' });
   }
};

exports.getById = async (req, res) => {
  try {
    const [[p]] = await db.query(
      `SELECT p.PRODUCT_ID, p.PRODUCT_DESC, p.PRODUCT_CLASS_CODE, p.PRODUCT_PRICE as PRICE, p.PRODUCT_QUANTITY_AVAIL as STOCK, pc.PRODUCT_CLASS_DESC
       FROM product p
       JOIN product_class pc ON p.PRODUCT_CLASS_CODE = pc.PRODUCT_CLASS_CODE
       WHERE p.PRODUCT_ID = ?`,
      [req.params.id]
    );
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json({ product: p });
  } catch (e) { 
    console.error(e);
   res.status(500).json({ message: 'An internal server error occurred' });
   }
};

exports.getCategories = async (req, res) => {
  try {
    const [cats] = await db.query(
      `SELECT pc.PRODUCT_CLASS_CODE, pc.PRODUCT_CLASS_DESC, COUNT(p.PRODUCT_ID) as count
       FROM product_class pc
       LEFT JOIN product p ON pc.PRODUCT_CLASS_CODE = p.PRODUCT_CLASS_CODE
       GROUP BY pc.PRODUCT_CLASS_CODE, pc.PRODUCT_CLASS_DESC 
       ORDER BY pc.PRODUCT_CLASS_DESC`
    );

    res.json({ categories: cats });
  } catch (e) { 
    console.error(e);
   res.status(500).json({ message: 'An internal server error occurred' });
   }
};
