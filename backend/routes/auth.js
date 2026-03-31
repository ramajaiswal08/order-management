const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authController = require('../controller/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', 
    [
        body('name').isLength({min : 3}),
        body('email').isEmail(),
        body('password').isLength({min : 6}),
    ],
    validate,
    authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
