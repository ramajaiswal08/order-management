const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const HttpStatus = require('../constants/httpStatus');
const AppError = require('../utils/AppError');
const ERRORS = require('../constants/errors');

const toInt = (val) => Number(val);

if (!process.env.JWT_EXPIRES) {
  throw new Error('JWT_EXPIRES is not defined in environment variables');
}

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES
  });

// REGISTER
exports.register = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    logger.warn(`Registration failed: Missing fields`);
    throw new AppError(ERRORS.REQUIRED_FIELDS, HttpStatus.BAD_REQUEST);
  }

  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    logger.info(`User already exists: ${normalizedEmail}`);
    throw new AppError(ERRORS.USER_EXISTS, HttpStatus.BAD_REQUEST);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email: normalizedEmail,
      password: hashed
    },
    select: {
      userId: true,
      username: true,
      email: true,
      role: true
    }
  });

  logger.info(`User registered: ${normalizedEmail}`);

  const token = signToken({ id: user.userId, role: user.role });

  return { token, user };
};

// LOGIN
exports.login = async ({ email, password }) => {
  if (!email || !password) {
    logger.warn(`Login failed: Missing credentials`);
    throw new AppError(ERRORS.REQUIRED_FIELDS, HttpStatus.BAD_REQUEST);
  }

  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      userId: true,
      username: true,
      email: true,
      password: true,
      role: true
    }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    logger.warn(`Invalid login attempt: ${normalizedEmail}`);
    throw new AppError(ERRORS.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
  }

  logger.info(`Login success: ${normalizedEmail}`);

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

// GET ME
exports.getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { userId: toInt(userId) },
    select: {
      userId: true,
      username: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    logger.warn(`User not found: ${userId}`);
    throw new AppError(ERRORS.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  logger.info(`Fetched user: ${user.email}`);

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