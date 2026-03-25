const db = require('../config/db');
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

  const [[existing]] = await db.query(
    'SELECT USER_ID FROM USERS WHERE EMAIL = ?',
    [email]
  );
  if (existing) {
    const err = new Error('User already exists');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  const [r] = await db.query(
    'INSERT INTO USERS (USERNAME, EMAIL, PASSWORD) VALUES (?, ?, ?)',
    [username, email, hashed]
  );

  logger.info(`Registered new user: ${email}`);
  const token = signToken({ id: r.insertId, role: 'user' });
  return { token, user: { id: r.insertId, username, email, role: 'user' } };
};

/**
 * Authenticate a user and return a JWT.
 */
exports.login = async ({ email, password }) => {
  const [[user]] = await db.query(
    'SELECT USER_ID, USERNAME, EMAIL, PASSWORD, ROLE FROM USERS WHERE EMAIL = ?',
    [email]
  );
  if (!user || !(await bcrypt.compare(password, user.PASSWORD))) {
    logger.warn(`Failed login attempt for: ${email}`);
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  logger.info(`Login success: ${email} (Role: ${user.ROLE})`);
  const token = signToken({ id: user.USER_ID, role: user.ROLE });
  return {
    token,
    user: { id: user.USER_ID, username: user.USERNAME, email: user.EMAIL, role: user.ROLE },
  };
};

/**
 * Fetch the current user from the DB and issue a fresh token (handles role changes).
 */
exports.getMe = async (userId) => {
  const [[user]] = await db.query(
    'SELECT USER_ID, USERNAME, EMAIL, ROLE FROM USERS WHERE USER_ID = ?',
    [userId]
  );
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  logger.info(`getMe: ${user.EMAIL} (Role: ${user.ROLE})`);
  const token = signToken({ id: user.USER_ID, role: user.ROLE });
  return {
    token,
    user: { id: user.USER_ID, username: user.USERNAME, email: user.EMAIL, role: user.ROLE },
  };
};
