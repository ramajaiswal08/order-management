const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const addressController = require('../controller/addressController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', authMiddleware, addressController.list);
router.post('/', authMiddleware,
    [
        body('line1').notEmpty().withMessage('Address line1 is required'),
        body('city').notEmpty().withMessage('City is required'),
        body('pincode').notEmpty().withMessage('Pincode is required'),
    ], 
    validate,
    addressController.add);
    router.delete('/:id', authMiddleware,
    [param('id').isInt().withMessage('Address ID must be a number')],
    validate,
    addressController.remove);

module.exports = router;
