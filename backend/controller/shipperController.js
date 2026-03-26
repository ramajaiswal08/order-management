const asyncHandler    = require('../utils/asyncHandler');
const shipperService  = require('../services/shipperService');

exports.list = asyncHandler(async (req, res) => {
  const shippers = await shipperService.list();
  res.json({ success: true, data: { shippers } });
});

// Admin only — enforced by adminOnly middleware in routes/shippers.js
exports.create = asyncHandler(async (req, res) => {
  const shipperId = await shipperService.create(req.body);
  res.status(201).json({ success: true, data: { shipperId }, message: 'Shipper added' });
});

// Admin only — enforced by adminOnly middleware in routes/shippers.js
exports.update = asyncHandler(async (req, res) => {
  await shipperService.update(req.params.id, req.body);
  res.json({ success: true, message: 'Shipper updated' });
});

// Admin only — enforced by adminOnly middleware in routes/shippers.js
exports.delete = asyncHandler(async (req, res) => {
  await shipperService.remove(req.params.id);
  res.json({ success: true, message: 'Shipper removed' });
});
