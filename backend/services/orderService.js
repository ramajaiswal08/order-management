const prisma = require('../config/db');
const logger = require('../utils/logger');


 function validateOrderInput(userId, items, shippingAddressId) {
  if (!items?.length || !shippingAddressId) {
    logger.warn(`Invalid order data by user ${userId}`);
    const err = new Error('Invalid order data');
    err.statusCode = 400;
    throw err;
  }
}

async function verifyAddress(userId, shippingAddressId) {
  const address = await prisma.address.findFirst({
    where: {
      addressId: parseInt(shippingAddressId),
      customerId: parseInt(userId)
    }
  });

  if (!address) {
    logger.warn(`Address not found for user ${userId}`);
    const err = new Error('Shipping address not found');
    err.statusCode = 404;
    throw err;
  }

  return address;
}

function aggregateItems(items) {
  return items.reduce((acc, it) => {
    const existing = acc.find(x => x.productId === it.productId);
    if (existing) existing.quantity += it.quantity;
    else acc.push({ productId: it.productId, quantity: it.quantity });
    return acc;
  }, []);
}

async function getShipper(tx) {
  return await tx.shipper.findFirst({
    orderBy: { shipperId: 'asc' },
    select: { shipperId: true }
  });
}

async function createOrderHeader(tx, userId, shippingAddressId, paymentMode, shipper) {
  return await tx.orderHeader.create({
    data: {
      customerId: parseInt(userId),
      orderDate: new Date(),
      orderStatus: 'pending',
      paymentMode: paymentMode || 'COD',
      paymentDate: new Date(),
      orderShipmentDate: new Date(Date.now() + 2 * 86400000),
      shipperId: shipper?.shipperId || null,
      shippingAddressId: parseInt(shippingAddressId)
    },
    select: { orderId: true }
  });
}

async function createOrderItems(tx, orderId, items) {
  await tx.orderItem.createMany({
    data: items.map(item => ({
      orderId,
      productId: parseInt(item.productId),
      productQuantity: item.quantity
    }))
  });
}

async function updateStock(tx, items) {
  for (const item of items) {
    await tx.product.update({
      where: { productId: parseInt(item.productId) },
      data: {
        productQuantityAvail: {
          decrement: item.quantity
        }
      }
    });
  }
}

exports.createOrder = async ({ userId, items, shippingAddressId, paymentMode }) => {

  // 1. Validate input
  validateOrderInput(userId, items, shippingAddressId);

  // 2. Verify address ownership
  await verifyAddress(userId, shippingAddressId);

  // 3. Run transaction
  return await prisma.$transaction(async (tx) => {

    // 4. Aggregate items
    const aggregatedItems = aggregateItems(items);

    // 5. Get shipper
    const shipper = await getShipper(tx);

    // 6. Create order header
    const order = await createOrderHeader(
      tx,
      userId,
      shippingAddressId,
      paymentMode,
      shipper
    );

    logger.info(`Order header created: ${order.orderId}`);

    // 7. Create order items
    await createOrderItems(tx, order.orderId, aggregatedItems);

    // 8. Update stock
    await updateStock(tx, aggregatedItems);

    logger.info(`Order created: ${order.orderId} for user ${userId}`);

    return { orderId: order.orderId };
  });
};    
   
/**
 * Get all orders for a given user (paginated).
 */
exports.getUserOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [total, orders] = await Promise.all([
    prisma.orderHeader.count({ where: { customerId: parseInt(userId) } }),
    prisma.orderHeader.findMany({
      where: { customerId: parseInt(userId) },
      include: {
        customer: {
          select: { username: true }
        },
        shipper: {
          select: { shipperName: true, shipperPhone: true }
        },
        orderItems: {
          include: {
            product: {
              select: { productDesc: true, productPrice: true }
            }
          }
        }
      },
      orderBy: { orderId: 'desc' },
      skip,
      take: limit
    })
  ]);

  // Transform to match expected format
  const data = orders.map(order => {
    const totalAmount = order.orderItems.reduce((acc, item) => {
      return acc + (Number(item.product.productPrice) * item.productQuantity);
    }, 0);

    const items = order.orderItems.map(item =>
      `${item.product.productDesc} x${item.productQuantity}`
    ).join(' | ');

    return {
      ORDER_ID: order.orderId,
      ORDER_DATE: order.orderDate,
      STATUS: order.orderStatus,
      USERNAME: order.customer?.username,
      SHIPPER_NAME: order.shipper?.shipperName,
      SHIPPER_PHONE: order.shipper?.shipperPhone,
      TOTAL_AMOUNT: totalAmount,
      ITEMS: items
    };
  });

  return {
    orders: data,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

/**
 * Get detailed view of a single order, scoped to the requesting user.
 */
exports.getOrderDetails = async (orderId, userId) => {
  const order = await prisma.orderHeader.findFirst({
    where: {
      orderId: parseInt(orderId),
      customerId: parseInt(userId)
    },
    include: {
      customer: {
        select: { username: true }
      },
      shipper: {
        select: { shipperId: true, shipperName: true, shipperPhone: true }
      },
      shippingAddress: {
        select: {
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          pincode: true,
          country: true
        }
      },
      orderItems: {
        include: {
          product: {
            select: { productId: true, productDesc: true, productPrice: true }
          }
        }
      }
    }
  });

  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  // Transform order items
  const items = order.orderItems.map(item => ({
    PRODUCT_ID: item.product.productId,
    PRODUCT_QUANTITY: item.productQuantity,
    PRODUCT_DESC: item.product.productDesc,
    PRODUCT_PRICE: item.product.productPrice,
    LINE_TOTAL: Number(item.product.productPrice) * item.productQuantity
  }));

  const totalAmount = items.reduce((acc, i) => acc + Number(i.LINE_TOTAL), 0);

  return {
    order: {
      ORDER_ID: order.orderId,
      ORDER_DATE: order.orderDate,
      STATUS: order.orderStatus,
      PAYMENT_MODE: order.paymentMode,
      ORDER_SHIPMENT_DATE: order.orderShipmentDate,
      SHIPPER_ID: order.shipper?.shipperId,
      SHIPPER_NAME: order.shipper?.shipperName,
      SHIPPER_PHONE: order.shipper?.shipperPhone,
      SHIPPING_ADDRESS_ID: order.shippingAddressId,
      ADDRESS_LINE1: order.shippingAddress?.addressLine1,
      ADDRESS_LINE2: order.shippingAddress?.addressLine2,
      CITY: order.shippingAddress?.city,
      STATE: order.shippingAddress?.state,
      PINCODE: order.shippingAddress?.pincode,
      COUNTRY: order.shippingAddress?.country,
      USERNAME: order.customer?.username,
      TOTAL_AMOUNT: totalAmount
    },
    items
  };
};

/**
 * Get all orders (admin only - paginated).
 */
exports.getAllOrders = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [total, orders] = await Promise.all([
    prisma.orderHeader.count(),
    prisma.orderHeader.findMany({
      include: {
        customer: {
          select: { username: true }
        },
        shipper: {
          select: { shipperName: true, shipperPhone: true }
        },
        orderItems: {
          include: {
            product: {
              select: { productDesc: true, productPrice: true }
            }
          }
        }
      },
      orderBy: { orderId: 'desc' },
      skip,
      take: limit
    })
  ]);

  // Transform to match expected format
  const data = orders.map(order => {
    const totalAmount = order.orderItems.reduce((acc, item) => {
      return acc + (Number(item.product.productPrice) * item.productQuantity);
    }, 0);

    const items = order.orderItems.map(item =>
      `${item.product.productDesc} x${item.productQuantity}`
    ).join(' | ');

    return {
      ORDER_ID: order.orderId,
      ORDER_DATE: order.orderDate,
      STATUS: order.orderStatus,
      USERNAME: order.customer?.username,
      SHIPPER_NAME: order.shipper?.shipperName,
      SHIPPER_PHONE: order.shipper?.shipperPhone,
      TOTAL_AMOUNT: totalAmount,
      ITEMS: items
    };
  });

  return {
    orders: data,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

/**
 * Update the status of an order (admin only).
 */
exports.updateStatus = async (orderId, rawStatus) => {
  if (!rawStatus) {
    const err = new Error('Status is required');
    err.statusCode = 400;
    throw err;
  }
  let status = rawStatus.toLowerCase();
  if (status === 'shipping') status = 'shipped'; // normalise alias

  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const result = await prisma.orderHeader.updateMany({
    where: { orderId: parseInt(orderId) },
    data: { orderStatus: status }
  });

  logger.info(`Order ${orderId} status updated to ${status} (${result.count} row)`);
  return status;
};

/**
 * Assign a shipper to an order (admin only).
 */
exports.assignShipper = async (orderId, shipperId) => {
  const shipper = await prisma.shipper.findUnique({
    where: { shipperId: parseInt(shipperId) }
  });

  if (!shipper) {
    const err = new Error('Shipper not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.orderHeader.update({
    where: { orderId: parseInt(orderId) },
    data: { shipperId: parseInt(shipperId) }
  });

  logger.info(`Shipper ${shipperId} assigned to order ${orderId}`);
};
