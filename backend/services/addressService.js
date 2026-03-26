const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * List all addresses for a user, default first.
 * Soft-deleted addresses are excluded.
 */
exports.list = async (userId) => {
  const addresses = await prisma.address.findMany({
    where: { 
      customerId: parseInt(userId),
      isDeleted: false 
    },
    select: {
      addressId: true,
      label: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      pincode: true,
      country: true,
      isDefault: true
    },
    orderBy: [
      { isDefault: 'desc' },
      { addressId: 'asc' }
    ]
  });

  // Transform keys for frontend compatibility
  return addresses.map(addr => ({
    ADDRESS_ID: addr.addressId,
    LABEL: addr.label,
    ADDRESS_LINE1: addr.addressLine1,
    ADDRESS_LINE2: addr.addressLine2,
    CITY: addr.city,
    STATE: addr.state,
    PINCODE: addr.pincode,
    COUNTRY: addr.country,
    IS_DEFAULT: addr.isDefault
  }));
};

/**
 * Add a new address for a user.
 * Wraps default-flag reset + insert in a transaction.
 */
exports.add = async (userId, { label, line1, line2, city, state, pincode, isDefault }) => {
  if (!line1 || !city || !pincode) {
    const err = new Error('line1, city and pincode are required');
    err.statusCode = 400;
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { customerId: parseInt(userId) },
        data: { isDefault: false }
      });
    }

    const address = await tx.address.create({
      data: {
        customerId: parseInt(userId),
        label: label || 'Home',
        addressLine1: line1,
        addressLine2: line2 || null,
        city,
        state: state || '',
        pincode: parseInt(pincode),
        country: 'India',
        isDefault: Boolean(isDefault)
      },
      select: { addressId: true }
    });

    return address.addressId;
  });
};

/**
 * Soft delete an address, verifying ownership first.
 * Deleting an address linked to an order is now safe as it's just a status change.
 */
exports.remove = async (userId, addressId) => {
  const address = await prisma.address.findFirst({
    where: {
      addressId: parseInt(addressId),
      customerId: parseInt(userId),
      isDeleted: false
    }
  });

  if (!address) {
    const err = new Error('Address not found');
    err.statusCode = 404;
    throw err;
  }

  // Soft delete: keep the record but hide it from the UI
  await prisma.address.update({
    where: { addressId: parseInt(addressId) },
    data: { isDeleted: true }
  });
  
  logger.info(`User ${userId} soft-deleted address ${addressId}`);
};
