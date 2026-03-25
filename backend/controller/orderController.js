const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../server.log');
const logToFile = (msg) => {
  const line = `${new Date().toISOString()} - ${msg}\n`;
  fs.appendFileSync(logFile, line);
};

exports.createOrder = async (req, res) => {
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const { items, totalAmount, shippingAddressId } = req.body;
    logToFile(`CreateOrder: User ${req.user.id} - ${items?.length} items`);
    if (!items?.length || !shippingAddressId) {
      return res.status(400).json({ message: 'Invalid order data' });
    }

    // choose shipper for this order (round-robin/random)
    const [[shipper]] = await conn.query('SELECT SHIPPER_ID FROM shipper ORDER BY SHIPPER_ID LIMIT 1');
    const shipperId = shipper ? shipper.SHIPPER_ID : null;

    // 1. Create Order Header
    const [r] = await conn.query(
      'INSERT INTO order_header (CUSTOMER_ID, ORDER_DATE, ORDER_STATUS, PAYMENT_MODE, PAYMENT_DATE, ORDER_SHIPMENT_DATE, SHIPPER_ID, SHIPPING_ADDRESS_ID) VALUES (?, NOW(), "pending", ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), ?, ?)',
      [req.user.id, req.body.paymentMode || 'COD', shipperId, shippingAddressId]
    );
    const orderId = r.insertId;
    if (!orderId || orderId === 0) {
      throw new Error('Failed to create order header');
    }

    // 2. Add Order Items (dedupe product rows before insert to avoid unique key conflict)
    const aggregatedItems = items.reduce((acc, it) => {
      const existing = acc.find(x => x.productId === it.productId);
      if (existing) {
        existing.quantity += it.quantity;
      } else {
        acc.push({ productId: it.productId, quantity: it.quantity });
      }
      return acc;
    }, []);

    // Insert items one by one to handle duplicates properly
    for (const item of aggregatedItems) {
      await conn.query(
        'INSERT INTO order_items (ORDER_ID, PRODUCT_ID, PRODUCT_QUANTITY) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE PRODUCT_QUANTITY = PRODUCT_QUANTITY + VALUES(PRODUCT_QUANTITY)',
        [orderId, item.productId, item.quantity]
      );
    }

    // 3. Update stock
    for (const it of aggregatedItems) {
      await conn.query('UPDATE product SET PRODUCT_QUANTITY_AVAIL = PRODUCT_QUANTITY_AVAIL - ? WHERE PRODUCT_ID = ?', [it.quantity, it.productId]);
    }

    await conn.commit();
    logToFile(`Order Created: ${orderId}`);
    res.status(201).json({ orderId, message: 'Order placed successfully' });
  } catch (e) {
    await conn.rollback();
    logToFile(`CreateOrder Error: ${e.message}`);
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT oh.ORDER_ID, oh.ORDER_DATE, oh.ORDER_STATUS AS STATUS,
              u.USERNAME, s.SHIPPER_NAME, s.SHIPPER_PHONE,
              SUM(COALESCE(p.PRODUCT_PRICE, 0) * oi.PRODUCT_QUANTITY) AS TOTAL_AMOUNT,
              GROUP_CONCAT(CONCAT(p.PRODUCT_DESC, ' x', oi.PRODUCT_QUANTITY) SEPARATOR ' | ') AS ITEMS
       FROM order_header oh
       LEFT JOIN users u ON oh.CUSTOMER_ID = u.USER_ID
       LEFT JOIN shipper s ON oh.SHIPPER_ID = s.SHIPPER_ID
       INNER JOIN order_items oi ON oh.ORDER_ID = oi.ORDER_ID
       INNER JOIN product p ON p.PRODUCT_ID = oi.PRODUCT_ID
       WHERE oh.CUSTOMER_ID = ?
       GROUP BY oh.ORDER_ID
       ORDER BY oh.ORDER_DATE DESC`,
      [req.user.id]
    );
    console.log('Orders for user', req.user.id, ':', orders);
    res.json({ orders });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const [[order]] = await db.query(
      `SELECT oh.ORDER_ID, oh.ORDER_DATE, oh.ORDER_STATUS AS STATUS, oh.PAYMENT_MODE, oh.ORDER_SHIPMENT_DATE,
              oh.SHIPPER_ID, s.SHIPPER_NAME, s.SHIPPER_PHONE, 
              oh.SHIPPING_ADDRESS_ID,
              a.ADDRESS_LINE1, a.ADDRESS_LINE2, a.CITY, a.STATE, a.PINCODE, a.COUNTRY,
              u.USERNAME
       FROM order_header oh
       LEFT JOIN shipper s ON oh.SHIPPER_ID = s.SHIPPER_ID
       LEFT JOIN address a ON oh.SHIPPING_ADDRESS_ID = a.ADDRESS_ID
       LEFT JOIN users u ON oh.CUSTOMER_ID = u.USER_ID
       WHERE oh.ORDER_ID = ? AND oh.CUSTOMER_ID = ?`,
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const [items] = await db.query(
      `SELECT oi.PRODUCT_ID, oi.PRODUCT_QUANTITY, p.PRODUCT_DESC, p.PRODUCT_PRICE,
              (p.PRODUCT_PRICE * oi.PRODUCT_QUANTITY) AS LINE_TOTAL
        FROM order_items oi
       JOIN product p ON oi.PRODUCT_ID = p.PRODUCT_ID
       WHERE oi.ORDER_ID = ?`,
      [req.params.id]
    );

    const totalAmount = items.reduce((acc, i) => acc + Number(i.LINE_TOTAL), 0);
    res.json({ order: { ...order, TOTAL_AMOUNT: totalAmount }, items });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Denied' });
    const [orders] = await db.query(
      `SELECT oh.ORDER_ID, oh.ORDER_DATE, oh.ORDER_STATUS AS STATUS,
              u.USERNAME, s.SHIPPER_NAME, s.SHIPPER_PHONE,
              SUM(COALESCE(p.PRODUCT_PRICE, 0) * oi.PRODUCT_QUANTITY) AS TOTAL_AMOUNT,
              GROUP_CONCAT(CONCAT(p.PRODUCT_DESC, ' x', oi.PRODUCT_QUANTITY) SEPARATOR ' | ') AS ITEMS
       FROM order_header oh
       LEFT JOIN users u ON oh.CUSTOMER_ID = u.USER_ID
       LEFT JOIN shipper s ON oh.SHIPPER_ID = s.SHIPPER_ID
       INNER JOIN order_items oi ON oh.ORDER_ID = oi.ORDER_ID
       INNER JOIN product p ON p.PRODUCT_ID = oi.PRODUCT_ID
       GROUP BY oh.ORDER_ID
       ORDER BY oh.ORDER_DATE DESC`
    );
    res.json({ orders });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    logToFile(`UpdateStatus Attempt: User ${req.user.id} (Role: ${req.user.role}) Order: ${req.params.id} to ${req.body.status}`);
    if (req.user.role !== 'admin') {
      logToFile(`Permission Denied: User role is ${req.user.role}`);
      return res.status(403).json({ message: 'Denied' });
    }
    let { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    status = status.toLowerCase();
    if (status === 'shipping') status = 'shipped';
    const validStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Valid values are: ${validStatus.join(', ')}` });
    }

    const [result] = await db.query('UPDATE order_header SET ORDER_STATUS = ? WHERE ORDER_ID = ?', [status, req.params.id]);
    logToFile(`Update result: ${result.affectedRows} rows updated`);
    res.json({ message: 'Status updated', status });
  } catch (e) {
    logToFile(`UpdateStatus Error: ${e.message}`);
    res.status(500).json({ message: e.message });
  }
};

exports.assignShipper = async (req, res) => {
  try {
    logToFile(`AssignShipper Attempt: User ${req.user.id} Order: ${req.params.id} Shipper: ${req.body.shipperId}`);
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Denied' });
    const { shipperId } = req.body;
    const [[shipper]] = await db.query('SELECT * FROM shipper WHERE SHIPPER_ID = ?', [shipperId]);
    if (!shipper) return res.status(404).json({ message: 'Shipper not found' });
    await db.query('UPDATE order_header SET SHIPPER_ID = ? WHERE ORDER_ID = ?', [shipperId, req.params.id]);
    logToFile(`Shipper Assigned: ${shipperId} to Order ${req.params.id}`);
    res.json({ message: 'Shipper assigned' });
  } catch (e) {
    logToFile(`AssignShipper Error: ${e.message}`);
    res.status(500).json({ message: e.message });
  }
};
