const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Middleware to handle express-validator errors.
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation failed for ${req.method} ${req.originalUrl}`);
    logger.warn(`Errors: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array().map(err => ({ field: err.path, message: err.msg })) 
    });
  }
  next();
};
