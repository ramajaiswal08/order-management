const jwt = require('jsonwebtoken');
const HttpStatus = require('../constants/httpStatus');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'supersecret123');
    next();
  } catch {
    res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid or expired token' });
  }
};
