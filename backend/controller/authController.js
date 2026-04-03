const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const HttpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');
const MESSAGES = require('../constants/messages')

exports.register = asyncHandler(async (req, res) => {
  logger.info(`User registration attempt: ${req.body.email}`);

  const data = await authService.register(req.body);
  res.status(HttpStatus.CREATED).json({ 
    success: true,
     data,
    message: MESSAGES.USER_REGISTERED,
    });
});

exports.login = asyncHandler(async (req, res) => {
  logger.info(`User login attempt: ${req.body.email}`);

  const data = await authService.login(req.body);
  res.status(HttpStatus.OK).json({
     success: true,
      data,
      message: MESSAGES.LOGIN_SUCCESS });
});

exports.getMe = asyncHandler(async (req, res) => {
  logger.info(`Fetching profile for user ${req.user.id}`);

  const data = await authService.getMe(req.user.id);
  res.status(HttpStatus.OK).json({
    success: true,
    data
  });
});
