const prisma = require('../config/db');

/**
 * List all shippers.
 */
exports.list = async () => {
  const shippers = await prisma.shipper.findMany({
    select: {
      shipperId: true,
      shipperName: true,
      shipperPhone: true,
      shipperAddress: true
    },
    orderBy: {
      shipperId: 'asc'
    }
  });

  // Transform to match expected format
  return shippers.map(shipper => ({
    SHIPPER_ID: shipper.shipperId,
    SHIPPER_NAME: shipper.shipperName,
    SHIPPER_PHONE: shipper.shipperPhone,
    SHIPPER_ADDRESS: shipper.shipperAddress
  }));
};

/**
 * Create a new shipper (admin only — enforced at route level).
 */
exports.create = async ({ SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS }) => {
  if (!SHIPPER_NAME || !SHIPPER_PHONE) {
    const err = new Error('SHIPPER_NAME and SHIPPER_PHONE are required');
    err.statusCode = 400;
    throw err;
  }

  const shipper = await prisma.shipper.create({
    data: {
      shipperName: SHIPPER_NAME,
      shipperPhone: SHIPPER_PHONE,
      shipperAddress: SHIPPER_ADDRESS || null
    },
    select: {
      shipperId: true
    }
  });

  return shipper.shipperId;
};

/**
 * Update a shipper by ID (admin only — enforced at route level).
 */
exports.update = async (shipperId, { SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS }) => {
  const existingShipper = await prisma.shipper.findUnique({
    where: { shipperId: parseInt(shipperId) }
  });

  if (!existingShipper) {
    const err = new Error('Shipper not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.shipper.update({
    where: { shipperId: parseInt(shipperId) },
    data: {
      shipperName: SHIPPER_NAME,
      shipperPhone: SHIPPER_PHONE,
      shipperAddress: SHIPPER_ADDRESS
    }
  });
};

/**
 * Delete a shipper by ID (admin only — enforced at route level).
 */
exports.remove = async (shipperId) => {
  const existingShipper = await prisma.shipper.findUnique({
    where: { shipperId: parseInt(shipperId) }
  });

  if (!existingShipper) {
    const err = new Error('Shipper not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.shipper.delete({
    where: { shipperId: parseInt(shipperId) }
  });
};
