const prisma = require('../config/db');
const logger = require('../utils/logger');
const orderService = require('../services/orderService');

//  CREATE ORDER
exports.createOrder = async ({ userId, items, shippingAddressId, paymentMode }) => {

  // 1. Validate input
  orderService.validateOrderInput(userId, items, shippingAddressId);

  // 2. Verify address
  await orderService.verifyAddress(userId, shippingAddressId);

  return await prisma.$transaction(async (tx) => {

    // 3. Aggregate items
    const aggregatedItems = orderService.aggregateItems(items);

    // 4. Get shipper
    const shipper = await orderService.getShipper(tx);

    // 5. Create order header
    const order = await orderService.createOrderHeader(
      tx,
      userId,
      shippingAddressId,
      paymentMode,
      shipper
    );

    logger.info(`Order header created: ${order.orderId}`);

    // 6. Create order items
    await orderService.createOrderItems(tx, order.orderId, aggregatedItems);

    // 7. Update stock
    await orderService.updateStock(tx, aggregatedItems);

    logger.info(`Order created: ${order.orderId} for user ${userId}`);

    return { orderId: order.orderId };
  });
};


// GET USER ORDERS 
exports.getUserOrders = async (userId, query) => {
  return await orderService.getUserOrders(userId, query);
};


// GET ORDER DETAILS 
exports.getOrderDetails = async (orderId, userId) => {
  return await orderService.getOrderDetails(orderId, userId);
};


// ADMIN: GET ALL ORDERS
exports.getAllOrders = async (query) => {
  return await orderService.getAllOrders(query);
};


//UPDATE STATUS
exports.updateStatus = async (orderId, status) => {
  return await orderService.updateStatus(orderId, status);
};


// ASSIGN SHIPPER
exports.assignShipper = async (orderId, shipperId) => {
  return await orderService.assignShipper(orderId, shipperId);
};