const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin1234',
  database: process.env.DB_NAME || 'orders',
  waitForConnections: true,
  connectionLimit: 10,
});

pool.getConnection()
  .then(c => { console.log('MySQL connected'); c.release(); })
  .catch(e => { console.error('DB Error:', e.message); process.exit(1); });

module.exports = pool;
