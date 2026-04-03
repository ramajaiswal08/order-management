const asyncHandler = require('../utils/asyncHandler');
const addressService = require('../services/addressService');
const HttpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');
const MESSAGES = require('../constants/messages');

exports.list = asyncHandler(async (req, res) => {
  logger.info(`Fetching addresses for user ${req.user.id}`);

  const addresses = await addressService.list(req.user.id);

  res.status(HttpStatus.OK).json({
    success: true,
    data: { addresses }
  });
});

exports.add = asyncHandler(async (req, res) => {
  logger.info(`Adding address for user ${req.user.id}`);

  const addressId = await addressService.add(req.user.id, req.body);

  res.status(HttpStatus.CREATED).json({
    success: true,
    data: { addressId },
    message: MESSAGES.ADDRESS_SAVED
  });
});

exports.remove = asyncHandler(async (req, res) => {
  logger.warn(`Deleting address ${req.params.id} by user ${req.user.id}`);

  await addressService.remove(req.user.id, req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: MESSAGES.ADDRESS_DELETED
  });
});