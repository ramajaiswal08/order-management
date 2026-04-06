const asyncHandler = require('../utils/asyncHandler');
const addressService = require('../services/addressService');
const HttpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');
const MESSAGES = require('../constants/messages');

exports.list = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  logger.info(`Fetching addresses | userId=${userId}`);

  const addresses = await addressService.list(userId);

  res.status(HttpStatus.OK).json({
    success: true,
    data: { addresses }
  });
});

exports.add = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  logger.info(`Adding address | userId=${userId}`);

  const addressId = await addressService.add(userId, req.body);

  res.status(HttpStatus.CREATED).json({
    success: true,
    data: { addressId },
    message: MESSAGES.ADDRESS_SAVED
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const addressId = req.params.id;

  logger.info(`Deleting address | addressId=${addressId}, userId=${userId}`);

  await addressService.remove(userId, addressId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: MESSAGES.ADDRESS_DELETED
  });
});