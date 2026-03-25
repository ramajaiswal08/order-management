const db = require('../config/db');

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM ADDRESS WHERE CUSTOMER_ID = ? ORDER BY IS_DEFAULT DESC, ADDRESS_ID',
      [req.user.id]
    );
    res.json({ addresses: rows });
  } catch (e){ console.error(e);
 res.status(500).json({ message: 'An internal server error occurred' });
  }
};

exports.add = async (req, res) => {
  try {
    const { label, line1, line2, city, state, pincode, isDefault } = req.body;
    if (!line1 || !city || !pincode)
      return res.status(400).json({ message: 'line1, city and pincode are required' });
    if (isDefault)
      await db.query('UPDATE ADDRESS SET IS_DEFAULT = 0 WHERE CUSTOMER_ID = ?', [req.user.id]);
    const [r] = await db.query(
      `INSERT INTO ADDRESS (CUSTOMER_ID, LABEL, ADDRESS_LINE1, ADDRESS_LINE2, CITY, STATE, PINCODE, COUNTRY, IS_DEFAULT)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'India', ?)`,
      [req.user.id, label || 'Home', line1, line2 || null, city, state || '', pincode, isDefault ? 1 : 0]
    );
    res.status(201).json({ addressId: r.insertId, message: 'Address saved' });
  } catch (e) { 
    console.error(e);
 res.status(500).json({ message: 'An internal server error occurred' });
   }
};

exports.remove = async (req, res) => {
  try {
    const [[a]] = await db.query(
      'SELECT * FROM ADDRESS WHERE ADDRESS_ID = ? AND CUSTOMER_ID = ?',
      [req.params.id, req.user.id]
    );
    if (!a) return res.status(404).json({ message: 'Address not found' });
    await db.query('DELETE FROM ADDRESS WHERE ADDRESS_ID = ?', [req.params.id]);
    res.json({ message: 'Address deleted' });
  } catch (e) { 
    console.error(e);
 res.status(500).json({ message: 'An internal server error occurred' });
   }
};
