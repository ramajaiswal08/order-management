/**
 * Custom Error class for operational errors.
 * Captures status code and marks the error as operational for safe reporting.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates this is an expected, handled error

    // Capturing stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
