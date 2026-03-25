const db = require('../config/db');

/**
 * List all addresses for a user, default first.
 */
exports.list = async (userId) => {
  const [rows] = await db.query(
    'SELECT ADDRESS_ID, LABEL, ADDRESS_LINE1, ADDRESS_LINE2, CITY, STATE, PINCODE, COUNTRY, IS_DEFAULT FROM ADDRESS WHERE CUSTOMER_ID = ? ORDER BY IS_DEFAULT DESC, ADDRESS_ID',
    [userId]
  );
  return rows;
};

/**
 * Add a new address for a user.
 * Wraps default-flag update + insert in a transaction to avoid a race condition.
 */
exports.add = async (userId, { label, line1, line2, city, state, pincode, isDefault }) => {
  if (!line1 || !city || !pincode) {
    const err = new Error('line1, city and pincode are required');
    err.statusCode = 400;
    throw err;
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    if (isDefault) {
      await conn.query('UPDATE ADDRESS SET IS_DEFAULT = 0 WHERE CUSTOMER_ID = ?', [userId]);
    }
    const [r] = await conn.query(
      `INSERT INTO ADDRESS (CUSTOMER_ID, LABEL, ADDRESS_LINE1, ADDRESS_LINE2, CITY, STATE, PINCODE, COUNTRY, IS_DEFAULT)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'India', ?)`,
      [userId, label || 'Home', line1, line2 || null, city, state || '', pincode, isDefault ? 1 : 0]
    );
    await conn.commit();
    return r.insertId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

/**
 * Delete an address, verifying ownership first.
 */
exports.remove = async (userId, addressId) => {
  const [[a]] = await db.query(
    'SELECT ADDRESS_ID FROM ADDRESS WHERE ADDRESS_ID = ? AND CUSTOMER_ID = ?',
    [addressId, userId]
  );
  if (!a) {
    const err = new Error('Address not found');
    err.statusCode = 404;
    throw err;
  }
  await db.query('DELETE FROM ADDRESS WHERE ADDRESS_ID = ?', [addressId]);
};
