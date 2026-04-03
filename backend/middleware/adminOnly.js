const HttpStatus = require('../constants/httpStatus');

module.exports = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(HttpStatus.FORBIDDEN).json({ message: 'Forbidden: admin access required' });
  }
  next();
};
