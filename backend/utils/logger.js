const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../server.log');

/**
 * Async file + console logger.
 * Replaces the duplicated `logToFile` from authController & orderController.
 * Uses fs.appendFile (non-blocking) instead of appendFileSync.
 */
const logger = {
  _write(level, msg) {
    const line = `${new Date().toISOString()} [${level}] ${msg}\n`;
    // Non-blocking — never stalls the event loop
    fs.appendFile(logFile, line, (err) => {
      if (err) console.error('Logger write error:', err);
    });
  },

  info(msg)  { this._write('INFO',  msg); console.log(msg); },
  warn(msg)  { this._write('WARN',  msg); console.warn(msg); },
  error(msg) { this._write('ERROR', msg); console.error(msg); },
};

module.exports = logger;
