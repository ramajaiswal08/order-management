const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, orderController.createOrder);
router.get('/', authMiddleware, orderController.getUserOrders);
router.get('/admin', authMiddleware, orderController.getAllOrders);
router.get('/:id', authMiddleware, orderController.getOrderDetails);
router.patch('/:id/status', authMiddleware, orderController.updateStatus);
router.patch('/:id/shipper', authMiddleware, orderController.assignShipper);

module.exports = router;
