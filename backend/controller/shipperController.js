const asyncHandler = require('../utils/asyncHandler');
const shipperService = require('../services/shipperService');
const HttpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');
const MESSAGES = require('../constants/messages');

// LIST SHIPPERS
exports.list = asyncHandler(async (req, res) => {
  logger.info(`Fetching all shippers`);

  const shippers = await shipperService.list();

  res.status(HttpStatus.OK).json({
    success: true,
    data: shippers   
  });
});


// CREATE SHIPPER (Admin)
exports.create = asyncHandler(async (req, res) => {
  logger.info(`Creating new shipper`);

  const shipperId = await shipperService.create(req.body);

  res.status(HttpStatus.CREATED).json({
    success: true,
    data: { shipperId },
    message: MESSAGES.SHIPPER_CREATED
  });
});


// UPDATE SHIPPER (Admin)
exports.update = asyncHandler(async (req, res) => {
  logger.info(`Updating shipper ${req.params.id}`);

  await shipperService.update(req.params.id, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: MESSAGES.SHIPPER_UPDATED
  });
});


// DELETE SHIPPER (Admin)
exports.delete = asyncHandler(async (req, res) => {
  logger.warn(`Deleting shipper ${req.params.id}`);

  await shipperService.remove(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: MESSAGES.SHIPPER_DELETED
  });
});