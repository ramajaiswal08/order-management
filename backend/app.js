require('dotenv').config();

// BigInt serialization fix for JSON.stringify (Prisma returns BigInt for some fields)
BigInt.prototype.toJSON = function() { return this.toString(); };

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const logger  = require('./utils/logger');

const authRoutes    = require('./routes/auth');
const addressRoutes = require('./routes/addresses');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');
const shipperRoutes = require('./routes/shippers');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/shippers',  shipperRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message    = err.message || 'Internal Server Error';
  
  // Don't leak details in production
  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logger.info(`Server started on port ${PORT}`);
});