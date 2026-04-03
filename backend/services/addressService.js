const prisma = require('../config/db');
const logger = require('../utils/logger');
const HttpStatus = require('../constants/httpStatus');
const AppError = require('../utils/AppError');
const ERRORS = require('../constants/errors');

const toInt = (val) => Number(val);

// LIST
exports.list = async (userId) => {
  const user = toInt(userId);

  const addresses = await prisma.address.findMany({
    where: { customerId: user },
    orderBy: [{ isDefault: 'desc' }, { addressId: 'asc' }]
  });

  logger.info(`Fetched ${addresses.length} addresses for user ${userId}`);

  return addresses;
};

// ADD
exports.add = async (userId, { label, line1, line2, city, state, pincode, isDefault }) => {
  if (!line1 || !city || !pincode) {
    logger.warn(`Address creation failed for user ${userId}`);
    throw new AppError(ERRORS.ADDRESS_REQUIRED_FIELDS, HttpStatus.BAD_REQUEST);
  }

  const user = toInt(userId);

  return prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { customerId: user },
        data: { isDefault: false }
      });
    }

    const address = await tx.address.create({
      data: {
        customerId: user,
        label: label || 'Home',
        addressLine1: line1,
        addressLine2: line2 || null,
        city,
        state: state || '',
        pincode,
        country: 'India',
        isDefault: Boolean(isDefault)
      }
    });

    logger.info(`Address created: ${address.addressId} for user ${userId}`);

    return address.addressId;
  });
};

// REMOVE
exports.remove = async (userId, addressId) => {
  const user = toInt(userId);
  const addrId = toInt(addressId);

  const address = await prisma.address.findFirst({
    where: {
      addressId: addrId,
      customerId: user
    }
  });

  if (!address) {
    logger.warn(`Address ${addressId} not found for user ${userId}`);
    throw new AppError(ERRORS.ADDRESS_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  await prisma.address.update({
    where: { addressId: addrId },
    data: { isDeleted: true }
  });

  logger.info(`Address deleted: ${addressId} for user ${userId}`);
};