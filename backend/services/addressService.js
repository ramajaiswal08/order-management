const prisma = require('../config/db');
const logger = require('../utils/logger');
const HttpStatus = require('../constants/httpStatus');
const AppError = require('../utils/AppError');
const ERRORS = require('../constants/errors');

// safe conversion
const toInt = (val) => {
  const n = Number(val);
  return isNaN(n) ? null : n;
};

// ================= LIST =================
exports.list = async (userId) => {
  const user = toInt(userId);

  if (!user) {
    logger.warn(`Invalid userId | userId=${userId}`);
    throw new AppError(ERRORS.INVALID_USER_ID, HttpStatus.BAD_REQUEST);
  }

  const addresses = await prisma.address.findMany({
    where: {
      customerId: user,
      isDeleted: false
    },
    orderBy: [
      { isDefault: 'desc' },
      { addressId: 'asc' }
    ]
  });

  logger.info(`Fetched ${addresses.length} addresses | userId=${user}`);

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

// ================= ADD =================
exports.add = async (userId, body) => {
  const user = toInt(userId);

  if (!user) {
    logger.warn(`Invalid userId | userId=${userId}`);
    throw new AppError(ERRORS.INVALID_USER_ID, HttpStatus.BAD_REQUEST);
  }

  const {
    label,
    line1,
    line2,
    city,
    state,
    pincode,
    isDefault
  } = body || {};

  if (!line1 || !city || !pincode) {
    logger.warn(`Address creation failed | userId=${user}`);
    throw new AppError(ERRORS.ADDRESS_REQUIRED_FIELDS, HttpStatus.BAD_REQUEST);
  }

  const addressId = await prisma.$transaction(async (tx) => {

    // handle default address
    if (isDefault) {
      await tx.address.updateMany({
        where: {
          customerId: user,
          isDeleted: false
        },
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
      },
      select: { addressId: true }
    });

    return address.addressId;
  });

  logger.info(`Address created | addressId=${addressId}, userId=${user}`);

  return addressId;
};

// ================= REMOVE =================
exports.remove = async (userId, addressId) => {
  const user = toInt(userId);
  const addrId = toInt(addressId);

  if (!user || !addrId) {
    logger.warn(`Invalid input | userId=${userId}, addressId=${addressId}`);
    throw new AppError(ERRORS.INVALID_INPUT, HttpStatus.BAD_REQUEST);
  }

  const address = await prisma.address.findFirst({
    where: {
      addressId: addrId,
      customerId: user,
      isDeleted: false
    }
  });

  if (!address) {
    logger.warn(`Address not found | addressId=${addrId}, userId=${user}`);
    throw new AppError(ERRORS.ADDRESS_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  await prisma.address.update({
    where: { addressId: addrId },
    data: { isDeleted: true }
  });

  logger.info(`Address deleted | addressId=${addrId}, userId=${user}`);
};