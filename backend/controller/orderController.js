const asyncHandler  = require('../utils/asyncHandler');
const orderService  = require('../services/orderService');

exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddressId, paymentMode } = req.body;
  const { orderId } = await orderService.createOrder({
    userId: req.user.id,
    items,
    shippingAddressId,
    paymentMode,
  });
  res.status(201).json({ orderId, message: 'Order placed successfully' });
});

exports.getUserOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getUserOrders(req.user.id);
  res.json({ orders });
});

exports.getOrderDetails = asyncHandler(async (req, res) => {
  const data = await orderService.getOrderDetails(req.params.id, req.user.id);
  res.json(data);
});

// Admin only — enforced by adminOnly middleware in routes/orders.js
exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.json({ orders });
});

// Admin only — enforced by adminOnly middleware in routes/orders.js
exports.updateStatus = asyncHandler(async (req, res) => {
  const status = await orderService.updateStatus(req.params.id, req.body.status);
  res.json({ message: 'Status updated', status });
});

// Admin only — enforced by adminOnly middleware in routes/orders.js
exports.assignShipper = asyncHandler(async (req, res) => {
  await orderService.assignShipper(req.params.id, req.body.shipperId);
  res.json({ message: 'Shipper assigned' });
});
