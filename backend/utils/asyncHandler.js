/**
 * Wraps an async route handler so that any thrown error is forwarded
 * to Express's next() — eliminating try/catch boilerplate in every controller.
 *
 * Usage:
 *   exports.myAction = asyncHandler(async (req, res) => { ... });
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
