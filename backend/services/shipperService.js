const prisma = require('../config/db');
const logger = require('../utils/logger');
const HttpStatus = require('../constants/httpStatus');
const AppError = require('../utils/AppError');
const ERRORS = require('../constants/errors');

const toInt = (val) => Number(val);

// LIST

exports.list = async () => {
  const shippers = await prisma.shipper.findMany({
    select: {
      shipperId: true,
      shipperName: true,
      shipperPhone: true,
      shipperAddress: true
    },
    orderBy: { shipperId: 'asc' }
  });

  logger.info(`Fetched ${shippers.length} shippers`);

  return shippers.map(s => ({
    SHIPPER_ID: s.shipperId,
    SHIPPER_NAME: s.shipperName,
    SHIPPER_PHONE: s.shipperPhone ? String(s.shipperPhone) : null,
    SHIPPER_ADDRESS: s.shipperAddress
  }));
};

// CREATE

exports.create = async ({ SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS }) => {
  if (!SHIPPER_NAME || !SHIPPER_PHONE) {
    logger.warn(`Shipper creation failed: Missing fields`);
    throw new AppError(ERRORS.REQUIRED_FIELDS, HttpStatus.BAD_REQUEST);
  }

  const shipper = await prisma.shipper.create({
    data: {
      shipperName: SHIPPER_NAME,
      shipperPhone: String(SHIPPER_PHONE), // ✅ force string
      shipperAddress: SHIPPER_ADDRESS || null
    },
    select: { shipperId: true }
  });

  logger.info(`Shipper created: ${shipper.shipperId}`);

  return shipper.shipperId;
};

// UPDATE

exports.update = async (shipperId, { SHIPPER_NAME, SHIPPER_PHONE, SHIPPER_ADDRESS }) => {
  const id = toInt(shipperId);

  const existing = await prisma.shipper.findUnique({
    where: { shipperId: id }
  });

  if (!existing) {
    logger.warn(`Update failed: Shipper not found (${id})`);
    throw new AppError(ERRORS.SHIPPER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const updateData = {};

  if (SHIPPER_NAME !== undefined) updateData.shipperName = SHIPPER_NAME;
  if (SHIPPER_PHONE !== undefined) updateData.shipperPhone = String(SHIPPER_PHONE);
  if (SHIPPER_ADDRESS !== undefined) updateData.shipperAddress = SHIPPER_ADDRESS;

  await prisma.shipper.update({
    where: { shipperId: id },
    data: updateData
  });

  logger.info(`Shipper updated: ${id}`);
};

//  DELETE

exports.remove = async (shipperId) => {
  const id = toInt(shipperId);

  const existing = await prisma.shipper.findUnique({
    where: { shipperId: id }
  });

  if (!existing) {
    logger.warn(`Delete failed: Shipper not found (${id})`);
    throw new AppError(ERRORS.SHIPPER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  await prisma.shipper.delete({
    where: { shipperId: id }
  });

  logger.info(`Shipper deleted: ${id}`); // ✅ added
};