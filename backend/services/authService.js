const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

/**
 * Register a new user.
 */
exports.register = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    const err = new Error('All fields are required');
    err.statusCode = 400;
    throw err;
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const err = new Error('User already exists');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashed
    },
    select: {
      userId: true,
      username: true,
      email: true,
      role: true
    }
  });

  logger.info(`Registered new user: ${email}`);
  const token = signToken({ id: user.userId, role: user.role });
  return { token, user };
};

/**
 * Authenticate a user and return a JWT.
 */
exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      userId: true,
      username: true,
      email: true,
      password: true,
      role: true
    }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    logger.warn(`Failed login attempt for: ${email}`);
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  logger.info(`Login success: ${email} (Role: ${user.role})`);
  const token = signToken({ id: user.userId, role: user.role });
  return {
    token,
    user: {
      id: user.userId,
      username: user.username,
      email: user.email,
      role: user.role
    }
  };
};

/**
 * Fetch the current user from the DB and issue a fresh token (handles role changes).
 */
exports.getMe = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { userId: parseInt(userId) },
    select: {
      userId: true,
      username: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  logger.info(`getMe: ${user.email} (Role: ${user.role})`);
  const token = signToken({ id: user.userId, role: user.role });
  return {
    token,
    user: {
      id: user.userId,
      username: user.username,
      email: user.email,
      role: user.role
    }
  };
};
