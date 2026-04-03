const prisma = require('../config/db');
const logger = require('../utils/logger');
const HttpStatus = require('../constants/httpStatus');
const AppError = require('../utils/AppError');
const ERRORS = require('../constants/errors');

const toInt = (val) => Number(val);

//VALIDATIONS

exports.validateOrderInput = (userId, items, shippingAddressId) => {
  if (!items?.length || !shippingAddressId) {
    logger.warn(`Invalid order data by user ${userId}`);
    throw new AppError(ERRORS.INVALID_ORDER, HttpStatus.BAD_REQUEST);
  }
};

exports.verifyAddress = async (userId, shippingAddressId) => {
  const address = await prisma.address.findFirst({
    where: {
      addressId: toInt(shippingAddressId),
      customerId: toInt(userId)
    }
  });

  if (!address) {
    logger.warn(`Address not found for user ${userId}`);
    throw new AppError(ERRORS.ADDRESS_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return address;
};

//  HELPERS

// Optimized aggregation (O(n))
exports.aggregateItems = (items) => {
  const map = new Map();

  for (const it of items) {
    map.set(
      it.productId,
      (map.get(it.productId) || 0) + it.quantity
    );
  }

  return Array.from(map, ([productId, quantity]) => ({
    productId,
    quantity
  }));
};

exports.getShipper = async (tx) => {
  return tx.shipper.findFirst({
    orderBy: { shipperId: 'asc' },
    select: { shipperId: true }
  });
};

// ORDER CREATION

exports.createOrderHeader = async (tx, userId, shippingAddressId, paymentMode, shipper) => {
  return tx.orderHeader.create({
    data: {
      customerId: toInt(userId),
      orderDate: new Date(),
      orderStatus: 'pending',
      paymentMode: paymentMode || 'COD',
      paymentDate: new Date(),
      orderShipmentDate: new Date(Date.now() + 2 * 86400000),
      shipperId: shipper?.shipperId || null,
      shippingAddressId: toInt(shippingAddressId)
    },
    select: { orderId: true }
  });
};

exports.createOrderItems = async (tx, orderId, items) => {
  await tx.orderItem.createMany({
    data: items.map(item => ({
      orderId,
      productId: toInt(item.productId),
      productQuantity: item.quantity
    }))
  });

  logger.info(`Order items created | orderId=${orderId}`);
};

//  stock validation
exports.updateStock = async (tx, items) => {
  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { productId: toInt(item.productId) }
    });

    if (!product || product.productQuantityAvail < item.quantity) {
      logger.warn(`Insufficient stock for product ${item.productId}`);
      throw new AppError(ERRORS.INSUFFICIENT_STOCK, HttpStatus.BAD_REQUEST);
    }

    await tx.product.update({
      where: { productId: toInt(item.productId) },
      data: {
        productQuantityAvail: {
          decrement: item.quantity
        }
      }
    });
  }

  logger.info(`Stock updated`);
};

// GET USER ORDERS 

exports.getUserOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const p = toInt(page) || 1;
  const l = toInt(limit) || 10;
  const skip = (p - 1) * l;

  const [total, orders] = await Promise.all([
    prisma.orderHeader.count({ where: { customerId: toInt(userId) } }),
    prisma.orderHeader.findMany({
      where: { customerId: toInt(userId) },
      include: {
        customer: { select: { username: true } },
        shipper: { select: { shipperName: true, shipperPhone: true } },
        orderItems: {
          include: {
            product: { select: { productDesc: true, productPrice: true } }
          }
        }
      },
      orderBy: { orderId: 'desc' },
      skip,
      take: l
    })
  ]);

  logger.info(`Orders fetched | userId=${userId}, count=${orders.length}`);

  const data = orders.map(order => {
    const totalAmount = order.orderItems.reduce((acc, item) =>
      acc + (Number(item.product.productPrice) * item.productQuantity), 0
    );

    return {
      ORDER_ID: order.orderId,
      STATUS: order.orderStatus,
      TOTAL_AMOUNT: totalAmount
    };
  });

  return {
    orders: data,
    total,
    page: p,
    pages: Math.ceil(total / l)
  };
};

// GET ORDER DETAILS 

exports.getOrderDetails = async (orderId, userId) => {
  const order = await prisma.orderHeader.findFirst({
    where: {
      orderId: toInt(orderId),
      customerId: toInt(userId)
    },
    include: {
      orderItems: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    logger.warn(`Order not found: ${orderId}`);
    throw new AppError(ERRORS.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return order;
};

// ADMIN 

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

exports.updateStatus = async (orderId, rawStatus) => {
  if (!rawStatus) {
    throw new AppError(ERRORS.STATUS_REQUIRED, HttpStatus.BAD_REQUEST);
  }

  let status = rawStatus.toLowerCase();
  if (status === 'shipping') status = 'shipped';

  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(ERRORS.INVALID_STATUS, HttpStatus.BAD_REQUEST);
  }

  const result = await prisma.orderHeader.updateMany({
    where: { orderId: toInt(orderId) },
    data: { orderStatus: status }
  });

  if (result.count === 0) {
    throw new AppError(ERRORS.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  logger.info(`Order ${orderId} updated to ${status}`);
  return status;
};

exports.assignShipper = async (orderId, shipperId) => {
  const shipper = await prisma.shipper.findUnique({
    where: { shipperId: toInt(shipperId) }
  });

  if (!shipper) {
    throw new AppError(ERRORS.SHIPPER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  await prisma.orderHeader.update({
    where: { orderId: toInt(orderId) },
    data: { shipperId: toInt(shipperId) }
  });

  logger.info(`Shipper ${shipperId} assigned to order ${orderId}`);
};