const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authController = require('../controller/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', 
    [
        body('username').isLength({min : 3}).withMessage('Name must be at least 3 characters long'),
        body('email').isEmail().withMessage('Invalid email address'),
        body('password').isLength({min : 6}).withMessage('Password must be at least 6 characters long'),
    ],
    validate,
    authController.register);
router.post('/login',
    [
     body('email')
      .isEmail()
      .withMessage('Invalid email'),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
    ],
    validate,
     authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
