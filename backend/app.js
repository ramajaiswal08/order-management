require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/shippers',  require('./routes/shippers'));

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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));