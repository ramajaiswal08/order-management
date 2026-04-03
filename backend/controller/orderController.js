const orderManager = require('../manager/orderManager');
const HttpStatus = require('../constants/httpStatus');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const MESSAGES = require('../constants/messages');

// CREATE ORDER
exports.createOrder = asyncHandler(async (req, res) => {
  logger.info(`Creating order for user ${req.user.id}`);

  const data = await orderManager.createOrder({
    userId: req.user.id,
    items: req.body.items,
    shippingAddressId: req.body.shippingAddressId,
    paymentMode: req.body.paymentMode
  });

  res.status(HttpStatus.CREATED).json({
    success: true,
    data,
    message: MESSAGES.ORDER_CREATED
  });
});


// GET USER ORDERS
exports.getUserOrders = asyncHandler(async (req, res) => {
  logger.info(`Fetching orders for user ${req.user.id}`);

  const data = await orderManager.getUserOrders(req.user.id, req.query);

  res.status(HttpStatus.OK).json({
    success: true,
    data
  });
});


// GET ORDER DETAILS
exports.getOrderDetails = asyncHandler(async (req, res) => {
  logger.info(`Fetching order ${req.params.id} for user ${req.user.id}`);

  const data = await orderManager.getOrderDetails(
    req.params.id,
    req.user.id
  );

  res.status(HttpStatus.OK).json({
    success: true,
    data
  });
});


// ADMIN: GET ALL ORDERS
exports.getAllOrders = asyncHandler(async (req, res) => {
  logger.info(`Admin fetching all orders`);

  const data = await orderManager.getAllOrders(req.query);

  res.status(HttpStatus.OK).json({
    success: true,
    data
  });
});


// UPDATE STATUS
exports.updateStatus = asyncHandler(async (req, res) => {
  logger.warn(`Updating order ${req.params.id} status`);

  const status = await orderManager.updateStatus(
    req.params.id,
    req.body.status
  );

  res.status(HttpStatus.OK).json({
    success: true,
    data: { status },
    message: MESSAGES.ORDER_STATUS_UPDATED
  });
});


// ASSIGN SHIPPER
exports.assignShipper = asyncHandler(async (req, res) => {
  logger.info(`Assigning shipper to order ${req.params.id}`);

  await orderManager.assignShipper(
    req.params.id,
    req.body.shipperId
  );

  res.status(HttpStatus.OK).json({
    success: true,
    message: MESSAGES.SHIPPER_ASSIGNED
  });
});