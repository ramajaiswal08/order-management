const asyncHandler    = require('../utils/asyncHandler');
const addressService  = require('../services/addressService');

exports.list = asyncHandler(async (req, res) => {
  const addresses = await addressService.list(req.user.id);
  res.json({ addresses });
});

exports.add = asyncHandler(async (req, res) => {
  const addressId = await addressService.add(req.user.id, req.body);
  res.status(201).json({ addressId, message: 'Address saved' });
});

exports.remove = asyncHandler(async (req, res) => {
  await addressService.remove(req.user.id, req.params.id);
  res.json({ message: 'Address deleted' });
});
