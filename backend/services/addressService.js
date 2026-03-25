const prisma = require('../config/db');

/**
 * List all addresses for a user, default first.
 */
exports.list = async (userId) => {
  const addresses = await prisma.address.findMany({
    where: { customerId: parseInt(userId) },
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

  // Transform to match expected format
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
 * Wraps default-flag update + insert in a transaction to avoid a race condition.
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
        pincode,
        country: 'India',
        isDefault: Boolean(isDefault)
      },
      select: {
        addressId: true
      }
    });

    return address.addressId;
  });
};

/**
 * Delete an address, verifying ownership first.
 */
exports.remove = async (userId, addressId) => {
  const address = await prisma.address.findFirst({
    where: {
      addressId: parseInt(addressId),
      customerId: parseInt(userId)
    }
  });

  if (!address) {
    const err = new Error('Address not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.address.delete({
    where: { addressId: parseInt(addressId) }
  });
};
