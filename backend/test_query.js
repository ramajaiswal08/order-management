const db = require('./config/db');

(async () => {
  try {
    const [rows] = await db.query(
      `SELECT oh.ORDER_ID, oh.ORDER_DATE, oh.ORDER_STATUS AS STATUS,
              u.USERNAME, s.SHIPPER_NAME, s.SHIPPER_PHONE,
              SUM(COALESCE(p.PRODUCT_PRICE, 0) * oi.PRODUCT_QUANTITY) AS TOTAL_AMOUNT,
              GROUP_CONCAT(CONCAT(p.PRODUCT_DESC, ' x', oi.PRODUCT_QUANTITY) SEPARATOR ' | ') AS ITEMS
       FROM order_header oh
       LEFT JOIN users u ON oh.CUSTOMER_ID = u.USER_ID
       LEFT JOIN shipper s ON oh.SHIPPER_ID = s.SHIPPER_ID
       INNER JOIN order_items oi ON oh.ORDER_ID = oi.ORDER_ID
       INNER JOIN product p ON p.PRODUCT_ID = oi.PRODUCT_ID
       WHERE oh.CUSTOMER_ID = 2
       GROUP BY oh.ORDER_ID
       ORDER BY oh.ORDER_DATE DESC`
    );
    console.log('Query result for user 2:', rows);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit();
  }
})();