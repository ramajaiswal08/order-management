const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Create a new order inside a transaction.
 * Validates input, picks a shipper, inserts header + items, decrements stock.
 */
exports.createOrder = async ({ userId, items, shippingAddressId, paymentMode }) => {
  if (!items?.length || !shippingAddressId) {
    const err = new Error('Invalid order data: items and shippingAddressId are required');
    err.statusCode = 400;
    throw err;
  }

  // Verify the address belongs to this user (prevents IDOR)
  const [[addr]] = await db.query(
    'SELECT ADDRESS_ID FROM ADDRESS WHERE ADDRESS_ID = ? AND CUSTOMER_ID = ?',
    [shippingAddressId, userId]
  );
  if (!addr) {
    const err = new Error('Shipping address not found');
    err.statusCode = 404;
    throw err;
  }

  // Acquire connection only after validation passes
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Deduplicate items by productId
    const aggregatedItems = items.reduce((acc, it) => {
      const existing = acc.find((x) => x.productId === it.productId);
      if (existing) existing.quantity += it.quantity;
      else acc.push({ productId: it.productId, quantity: it.quantity });
      return acc;
    }, []);

    // Pick a shipper (round-robin by lowest ID — can be extended)
    const [[shipper]] = await conn.query(
      'SELECT SHIPPER_ID FROM shipper ORDER BY SHIPPER_ID LIMIT 1'
    );

    // 1. Insert order header
    const [r] = await conn.query(
      `INSERT INTO order_header
         (CUSTOMER_ID, ORDER_DATE, ORDER_STATUS, PAYMENT_MODE, PAYMENT_DATE, ORDER_SHIPMENT_DATE, SHIPPER_ID, SHIPPING_ADDRESS_ID)
       VALUES (?, NOW(), 'pending', ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), ?, ?)`,
      [userId, paymentMode || 'COD', shipper?.SHIPPER_ID ?? null, shippingAddressId]
    );
    const orderId = r.insertId;

    // 2. Bulk-insert order items (ON DUPLICATE KEY handles any residual dupes)
    for (const item of aggregatedItems) {
      await conn.query(
        `INSERT INTO order_items (ORDER_ID, PRODUCT_ID, PRODUCT_QUANTITY)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE PRODUCT_QUANTITY = PRODUCT_QUANTITY + VALUES(PRODUCT_QUANTITY)`,
        [orderId, item.productId, item.quantity]
      );
    }

    // 3. Decrement stock
    for (const it of aggregatedItems) {
      await conn.query(
        'UPDATE product SET PRODUCT_QUANTITY_AVAIL = PRODUCT_QUANTITY_AVAIL - ? WHERE PRODUCT_ID = ?',
        [it.quantity, it.productId]
      );
    }

    await conn.commit();
    logger.info(`Order created: ${orderId} for user ${userId}`);
    return { orderId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

/**
 * Get all orders for a given user.
 */
exports.getUserOrders = async (userId) => {
  const [orders] = await db.query(
    `SELECT oh.ORDER_ID, oh.ORDER_DATE, oh.ORDER_STATUS AS STATUS,
            u.USERNAME, s.SHIPPER_NAME, s.SHIPPER_PHONE,
            SUM(COALESCE(p.PRODUCT_PRICE, 0) * oi.PRODUCT_QUANTITY) AS TOTAL_AMOUNT,
            GROUP_CONCAT(CONCAT(p.PRODUCT_DESC, ' x', oi.PRODUCT_QUANTITY) SEPARATOR ' | ') AS ITEMS
     FROM order_header oh
     LEFT JOIN users u        ON oh.CUSTOMER_ID = u.USER_ID
     LEFT JOIN shipper s      ON oh.SHIPPER_ID  = s.SHIPPER_ID
     INNER JOIN order_items oi ON oh.ORDER_ID   = oi.ORDER_ID
     INNER JOIN product p      ON p.PRODUCT_ID  = oi.PRODUCT_ID
     WHERE oh.CUSTOMER_ID = ?
     GROUP BY oh.ORDER_ID
     ORDER BY oh.ORDER_DATE DESC`,
    [userId]
  );
  return orders;
};

/**
 * Get detailed view of a single order, scoped to the requesting user.
 */
exports.getOrderDetails = async (orderId, userId) => {
  const [[order]] = await db.query(
    `SELECT oh.ORDER_ID, oh.ORDER_DATE, oh.ORDER_STATUS AS STATUS, oh.PAYMENT_MODE,
            oh.ORDER_SHIPMENT_DATE, oh.SHIPPER_ID,
            s.SHIPPER_NAME, s.SHIPPER_PHONE,
            oh.SHIPPING_ADDRESS_ID,
            a.ADDRESS_LINE1, a.ADDRESS_LINE2, a.CITY, a.STATE, a.PINCODE, a.COUNTRY,
            u.USERNAME
     FROM order_header oh
     LEFT JOIN shipper s ON oh.SHIPPER_ID          = s.SHIPPER_ID
     LEFT JOIN address a ON oh.SHIPPING_ADDRESS_ID = a.ADDRESS_ID
     LEFT JOIN users u   ON oh.CUSTOMER_ID         = u.USER_ID
     WHERE oh.ORDER_ID = ? AND oh.CUSTOMER_ID = ?`,
    [orderId, userId]
  );
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  const [items] = await db.query(
    `SELECT oi.PRODUCT_ID, oi.PRODUCT_QUANTITY, p.PRODUCT_DESC, p.PRODUCT_PRICE,
            (p.PRODUCT_PRICE * oi.PRODUCT_QUANTITY) AS LINE_TOTAL
     FROM order_items oi
     JOIN product p ON oi.PRODUCT_ID = p.PRODUCT_ID
     WHERE oi.ORDER_ID = ?`,
    [orderId]
  );

  const totalAmount = items.reduce((acc, i) => acc + Number(i.LINE_TOTAL), 0);
  return { order: { ...order, TOTAL_AMOUNT: totalAmount }, items };
};

/**
 * Get all orders (admin only).
 */
exports.getAllOrders = async () => {
  const [orders] = await db.query(
    `SELECT oh.ORDER_ID, oh.ORDER_DATE, oh.ORDER_STATUS AS STATUS,
            u.USERNAME, s.SHIPPER_NAME, s.SHIPPER_PHONE,
            SUM(COALESCE(p.PRODUCT_PRICE, 0) * oi.PRODUCT_QUANTITY) AS TOTAL_AMOUNT,
            GROUP_CONCAT(CONCAT(p.PRODUCT_DESC, ' x', oi.PRODUCT_QUANTITY) SEPARATOR ' | ') AS ITEMS
     FROM order_header oh
     LEFT JOIN users u        ON oh.CUSTOMER_ID = u.USER_ID
     LEFT JOIN shipper s      ON oh.SHIPPER_ID  = s.SHIPPER_ID
     INNER JOIN order_items oi ON oh.ORDER_ID   = oi.ORDER_ID
     INNER JOIN product p      ON p.PRODUCT_ID  = oi.PRODUCT_ID
     GROUP BY oh.ORDER_ID
     ORDER BY oh.ORDER_DATE DESC`
  );
  return orders;
};

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

/**
 * Update the status of an order (admin only).
 */
exports.updateStatus = async (orderId, rawStatus) => {
  if (!rawStatus) {
    const err = new Error('Status is required');
    err.statusCode = 400;
    throw err;
  }
  let status = rawStatus.toLowerCase();
  if (status === 'shipping') status = 'shipped'; // normalise alias

  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const [result] = await db.query(
    'UPDATE order_header SET ORDER_STATUS = ? WHERE ORDER_ID = ?',
    [status, orderId]
  );
  logger.info(`Order ${orderId} status updated to ${status} (${result.affectedRows} row)`);
  return status;
};

/**
 * Assign a shipper to an order (admin only).
 */
exports.assignShipper = async (orderId, shipperId) => {
  const [[shipper]] = await db.query(
    'SELECT SHIPPER_ID FROM shipper WHERE SHIPPER_ID = ?',
    [shipperId]
  );
  if (!shipper) {
    const err = new Error('Shipper not found');
    err.statusCode = 404;
    throw err;
  }
  await db.query(
    'UPDATE order_header SET SHIPPER_ID = ? WHERE ORDER_ID = ?',
    [shipperId, orderId]
  );
  logger.info(`Shipper ${shipperId} assigned to order ${orderId}`);
};
