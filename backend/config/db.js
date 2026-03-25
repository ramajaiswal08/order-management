const mysql = require('mysql2/promise');
require('dotenv').config();

// Custom error class for database-related exceptions
class DatabaseError extends Error {
  constructor(message, code = 'DATABASE_ERROR') {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new DatabaseError(`Missing required environment variable: ${varName}`, 'CONFIG_ERROR');
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test connection and handle errors with custom exceptions
pool.getConnection()
  .then(c => {
    console.log('MySQL connected');
    c.release();
  })
  .catch(e => {
    throw new DatabaseError(`Database connection failed: ${e.message}`, 'CONNECTION_ERROR');
  });

module.exports = pool;
