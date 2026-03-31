const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

router.get('/',
     productController.getAll);
router.get('/categories', productController.getCategories);
router.get('/:id',
    [
         param('id')
      .isInt()
      .withMessage('Product ID must be an integer')
  ],
  validate,
    productController.getById);

module.exports = router;
