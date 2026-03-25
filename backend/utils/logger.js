
/**
 * Async file + console logger.
 * Replaces the duplicated `logToFile` from authController & orderController.
 * Uses fs.appendFile (non-blocking) instead of appendFileSync.
 */
const logger = {
  _write(level, msg) {
    const line = `[${level}] ${msg}`;
    if (level === 'ERROR') {
      console.error(line);
    } else if (level === 'WARN') {
      console.warn(line);
    } else {
      console.log(line);
    }
  },

  info(msg)  { this._write('INFO',  msg); },
  warn(msg)  { this._write('WARN',  msg); },
  error(msg) { this._write('ERROR', msg); },
};

module.exports = logger;
