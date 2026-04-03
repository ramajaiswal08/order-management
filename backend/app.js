const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const HttpStatus = require('./constants/httpStatus');
const AppError = require('./utils/AppError');
const logger = require('./utils/logger');

const app = express();

// Security Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/addresses', require('./routes/addresses'));
app.use('/api/v1/shippers', require('./routes/shippers'));

// 404 catch-all
app.use((req, res) => {
  res.status(HttpStatus.NOT_FOUND).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, _next) => {
  const status = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  const isOperational = err.isOperational || false;

  // Log all 5xx or non-operational errors as errors, others as warnings/info
  if (status >= 500 || !isOperational) {
    logger.error('Unhandled/Server Error: ', err);
  } else {
    logger.warn(`Operational Error [${status}]: ${err.message}`);
  }

  const message = (isOperational || status < 500)
    ? err.message
    : 'An internal server error occurred';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;