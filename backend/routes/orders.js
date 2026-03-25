const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const authMiddleware  = require('../middleware/auth');
const adminOnly       = require('../middleware/adminOnly');

router.post('/',              authMiddleware,            orderController.createOrder);
router.get('/',               authMiddleware,            orderController.getUserOrders);
router.get('/admin',          authMiddleware, adminOnly, orderController.getAllOrders);
router.get('/:id',            authMiddleware,            orderController.getOrderDetails);
router.patch('/:id/status',   authMiddleware, adminOnly, orderController.updateStatus);
router.patch('/:id/shipper',  authMiddleware, adminOnly, orderController.assignShipper);

module.exports = router;
