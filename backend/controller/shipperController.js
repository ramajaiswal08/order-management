const db = require('../config/db');

exports.list = async (req, res) => {
  try {
    const [shippers] = await db.query('SELECT * FROM shipper');
    res.json({ shippers });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Denied' });
    const { SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS } = req.body;
    if (!SHIPPER_NAME || !SHIPPER_PHONE) return res.status(400).json({ message: 'Invalid shipper info' });

    const [r] = await db.query('INSERT INTO shipper (SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS) VALUES (?, ?, ?)', [SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS || null]);
    res.status(201).json({ shipperId: r.insertId, message: 'Shipper added' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Denied' });
    const { SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS } = req.body;
    await db.query('UPDATE shipper SET SHIPPER_NAME = ?, SHIPPER_PHONE = ?, SHIPPER_ADDRESS = ? WHERE SHIPPER_ID = ?', [SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS, req.params.id]);
    res.json({ message: 'Shipper updated' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.delete = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Denied' });
    await db.query('DELETE FROM shipper WHERE SHIPPER_ID = ?', [req.params.id]);
    res.json({ message: 'Shipper removed' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
