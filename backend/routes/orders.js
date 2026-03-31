const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const authMiddleware  = require('../middleware/auth');
const adminOnly       = require('../middleware/adminOnly');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

router.post('/',
     authMiddleware, 
            [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items must be a non-empty array'),

    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),

    body('shippingAddressId')
      .isInt()
      .withMessage('Shipping address ID is required'),
  ],
  validate,    
    orderController.createOrder);
router.get('/',               authMiddleware,            orderController.getUserOrders);
router.get('/admin',          authMiddleware, adminOnly, orderController.getAllOrders);
router.get('/:id',            authMiddleware,
    [
         param('id')
      .isInt()
      .withMessage('Order ID must be integer')
  ],
  validate,
    orderController.getOrderDetails);
router.patch('/:id/status',   authMiddleware, adminOnly, 
    [
    param('id').isInt().withMessage('Order ID must be integer'),

    body('status')
      .isString()
      .notEmpty()
      .withMessage('Status is required')
  ],
  validate,
    orderController.updateStatus);
router.patch('/:id/shipper',  authMiddleware, adminOnly,
    [
    param('id').isInt().withMessage('Order ID must be integer'),

    body('shipperId')
      .isInt()
      .withMessage('Shipper ID must be integer')
  ],
  validate,
    orderController.assignShipper);

module.exports = router;

