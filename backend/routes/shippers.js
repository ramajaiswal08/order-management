const express = require('express');
const router = express.Router();
const shipperController = require('../controller/shipperController');
const authMiddleware    = require('../middleware/auth');
const adminOnly         = require('../middleware/adminOnly');

const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.get('/',       authMiddleware,            shipperController.list);

router.post('/', [
  authMiddleware,
  adminOnly,
  body('SHIPPER_NAME').trim().notEmpty().withMessage('Shipper name is required'),
  body('SHIPPER_PHONE').notEmpty().withMessage('Shipper phone is required'),
  validate
], shipperController.create);

router.patch('/:id', [
  authMiddleware,
  adminOnly,
  body('SHIPPER_NAME').optional().trim().notEmpty(),
  body('SHIPPER_PHONE').optional().notEmpty(),
  validate
], shipperController.update);

router.delete('/:id', authMiddleware, adminOnly, shipperController.delete);

module.exports = router;
