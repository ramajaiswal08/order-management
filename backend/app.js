const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');

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

app.use('/api/v1/auth',      require('./routes/auth'));
app.use('/api/v1/orders',    require('./routes/orders'));
app.use('/api/v1/products',  require('./routes/products'));
app.use('/api/v1/addresses', require('./routes/addresses'));
app.use('/api/v1/shippers',  require('./routes/shippers'));

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
// asyncHandler forwards all thrown errors here via next(err).
// Errors thrown from services carry a statusCode property.
app.use((err, req, res, _next) => {
  const status = err.statusCode || 500;
  const message = status < 500
    ? err.message                       // operational error — safe to surface
    : 'An internal server error occurred'; // programmer error — hide details
  if (status >= 500) console.error(err); // only log unexpected errors
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;