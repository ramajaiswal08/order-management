const asyncHandler  = require('../utils/asyncHandler');
const orderService  = require('../services/orderService');

exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddressId, paymentMode } = req.body;
  const data = await orderService.createOrder({
    userId: req.user.id,
    items,
    shippingAddressId,
    paymentMode,
  });
  res.status(201).json({ success: true, data, message: 'Order placed successfully' });
});

exports.getUserOrders = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await orderService.getUserOrders(req.user.id, { 
    page: parseInt(page) || 1, 
    limit: parseInt(limit) || 10 
  });
  res.json({ success: true, data });
});

exports.getOrderDetails = asyncHandler(async (req, res) => {
  const data = await orderService.getOrderDetails(req.params.id, req.user.id);
  res.json({ success: true, data });
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await orderService.getAllOrders({ 
    page: parseInt(page) || 1, 
    limit: parseInt(limit) || 10 
  });
  res.json({ success: true, data });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const status = await orderService.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, data: { status }, message: 'Status updated' });
});

exports.assignShipper = asyncHandler(async (req, res) => {
  await orderService.assignShipper(req.params.id, req.body.shipperId);
  res.json({ success: true, message: 'Shipper assigned' });
});
