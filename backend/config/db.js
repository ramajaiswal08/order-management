const { PrismaClient } = require('@prisma/client');

// Custom error class for database-related exceptions
class DatabaseError extends Error {
  constructor(message, code = 'DATABASE_ERROR') {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw new DatabaseError(`Database connection failed: ${error.message}`, 'CONNECTION_ERROR');
  }
}

// Call test connection
// testConnection();

module.exports = prisma;
module.exports.DatabaseError = DatabaseError;
testConnection();
