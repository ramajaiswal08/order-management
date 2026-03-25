const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../server.log');
const logToFile = (msg) => {
  const line = `${new Date().toISOString()} - ${msg}\n`;
  fs.appendFileSync(logFile, line);
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    logToFile(`Register attempt: ${email}`);
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [[existing]] = await db.query('SELECT * FROM USERS WHERE EMAIL = ?', [email]);
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO USERS (USERNAME, EMAIL, PASSWORD) VALUES (?, ?, ?)',
      [username, email, hashed]
    );

    const token = jwt.sign({ id: r.insertId, role: 'user' }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: r.insertId, username, email, role: 'user' } });
  } catch (e) { 
    logToFile(`Register Error: ${e.message}`);
    console.error(e);
 res.status(500).json({ message: 'An internal server error occurred' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    logToFile(`Login attempt: ${email}`);
    const [[user]] = await db.query('SELECT * FROM USERS WHERE EMAIL = ?', [email]);
    if (!user || !(await bcrypt.compare(password, user.PASSWORD))) {
      logToFile(`Login failed for: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.USER_ID, role: user.ROLE }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1d' });
    logToFile(`Login success: ${email} (Role: ${user.ROLE})`);
    res.json({ token, user: { id: user.USER_ID, username: user.USERNAME, email: user.EMAIL, role: user.ROLE } });
  } catch (e) { 
    logToFile(`Login Error: ${e.message}`);
    console.error(e);
 res.status(500).json({ message: 'An internal server error occurred' }); 
  }
};

exports.getMe = async (req, res) => {
  try {
    logToFile(`getMe: User ID ${req.user.id} (Token Role: ${req.user.role})`);
    const [[user]] = await db.query('SELECT USER_ID, USERNAME, EMAIL, ROLE FROM USERS WHERE USER_ID = ?', [req.user.id]);
    if (!user) {
      logToFile(`getMe: User ID ${req.user.id} not found in DB`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Always provide a fresh token in case the role changed in DB
    const newToken = jwt.sign({ id: user.USER_ID, role: user.ROLE }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1d' });
    logToFile(`getMe success: ${user.EMAIL} (DB Role: ${user.ROLE})`);
    
    res.json({ 
      token: newToken, 
      user: { id: user.USER_ID, username: user.USERNAME, email: user.EMAIL, role: user.ROLE } 
    });
  } catch (e) { 
    logToFile(`getMe Error: ${e.message}`);
    console.error(e);
 res.status(500).json({ message: 'An internal server error occurred' });
  }
};
