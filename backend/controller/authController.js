const asyncHandler = require('../utils/asyncHandler');
const authService  = require('../services/authService');

exports.register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  res.status(201).json(data);
});

exports.login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.json(data);
});

exports.getMe = asyncHandler(async (req, res) => {
  const data = await authService.getMe(req.user.id);
  res.json(data);
});
