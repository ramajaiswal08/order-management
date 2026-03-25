const db = require('../config/db');

/**
 * List all shippers.
 */
exports.list = async () => {
  const [shippers] = await db.query(
    'SELECT SHIPPER_ID, SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS FROM shipper'
  );
  return shippers;
};

/**
 * Create a new shipper (admin only — enforced at route level).
 */
exports.create = async ({ SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS }) => {
  if (!SHIPPER_NAME || !SHIPPER_PHONE) {
    const err = new Error('SHIPPER_NAME and SHIPPER_PHONE are required');
    err.statusCode = 400;
    throw err;
  }
  const [r] = await db.query(
    'INSERT INTO shipper (SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS) VALUES (?, ?, ?)',
    [SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS || null]
  );
  return r.insertId;
};

/**
 * Update a shipper by ID (admin only — enforced at route level).
 */
exports.update = async (shipperId, { SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS }) => {
  const [[existing]] = await db.query(
    'SELECT SHIPPER_ID FROM shipper WHERE SHIPPER_ID = ?',
    [shipperId]
  );
  if (!existing) {
    const err = new Error('Shipper not found');
    err.statusCode = 404;
    throw err;
  }
  await db.query(
    'UPDATE shipper SET SHIPPER_NAME = ?, SHIPPER_PHONE = ?, SHIPPER_ADDRESS = ? WHERE SHIPPER_ID = ?',
    [SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS, shipperId]
  );
};

/**
 * Delete a shipper by ID (admin only — enforced at route level).
 */
exports.remove = async (shipperId) => {
  const [[existing]] = await db.query(
    'SELECT SHIPPER_ID FROM shipper WHERE SHIPPER_ID = ?',
    [shipperId]
  );
  if (!existing) {
    const err = new Error('Shipper not found');
    err.statusCode = 404;
    throw err;
  }
  await db.query('DELETE FROM shipper WHERE SHIPPER_ID = ?', [shipperId]);
};
