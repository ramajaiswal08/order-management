/**
 * Route-level middleware that allows only admin users.
 * Must be applied AFTER the authMiddleware so req.user is already populated.
 *
 * Usage in routes:
 *   router.get('/admin', authMiddleware, adminOnly, controller.fn);
 */
module.exports = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin access required' });
  }
  next();
};
